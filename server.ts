import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Stripe from "stripe";

const app = express();
const PORT = 3000;
const STORE_FILE = path.join(process.cwd(), "db_store.json");

app.use(express.json());

// Initialize Gemini
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
}

// Initial products
const PRODUCTS = [
  {
    id: "overcoat-01",
    name: "Jaffe Signature Wool Overcoat",
    price: 850,
    category: "apparel",
    imageUrl: "/src/assets/images/jaffe_overcoat_1784293854295.jpg",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Noir", "Graphite"],
    stock: 12,
    description: "An architectural masterpiece in pure virgin wool. Featuring sharp, structured shoulders, double-breasted closure, and a modern relaxed silhouette. Finished with handmade horn buttons and lined with premium silk.",
    details: ["100% Virgin Wool", "Silk lining", "Double-breasted front", "Made in Italy", "Dry clean only"]
  },
  {
    id: "watch-01",
    name: "Jaffe Chrono-Minimalist II",
    price: 1200,
    category: "accessories",
    imageUrl: "/src/assets/images/jaffe_watch_1784293875954.jpg",
    sizes: ["Standard"],
    colors: ["Matte Black", "Silver Accent"],
    stock: 5,
    description: "The epitome of horological restraint. A matte black titanium case houses a precise automatic movement, paired with a hand-stitched French calfskin strap. Water resistant to 50 meters.",
    details: ["Titanium 40mm case", "Swiss automatic movement", "French calfskin strap", "Scratch-resistant sapphire crystal", "5-year warranty"]
  },
  {
    id: "boots-01",
    name: "Jaffe Chelsea Leather Boots",
    price: 620,
    category: "footwear",
    imageUrl: "/src/assets/images/jaffe_boots_1784293893223.jpg",
    sizes: ["EU 40", "EU 41", "EU 42", "EU 43", "EU 44"],
    colors: ["Matte Black", "Polished Onyx"],
    stock: 8,
    description: "Designed with architectural precision, these Chelsea boots feature premium full-grain Italian calfskin, sleek elastic side panels, and a Goodyear-welted rubber sole for enduring refinement.",
    details: ["Italian calfskin leather", "Goodyear-welted sole", "Leather lining", "Ergonomic cork footbed", "Handcrafted in Portugal"]
  },
  {
    id: "bag-01",
    name: "Jaffe Geometric Leather Tote",
    price: 950,
    category: "accessories",
    imageUrl: "/src/assets/images/jaffe_bag_1784293913257.jpg",
    sizes: ["Standard"],
    colors: ["Stealth Black", "Contrast White"],
    stock: 15,
    description: "A clean, structural tote bag with sharp geometric lines. Crafted from scratch-resistant pebbled leather, opening to a spacious suede-lined interior with secure compartments.",
    details: ["Pebbled calf leather", "Real suede lining", "Internal zip pocket", "Fits 15\" laptop", "Dimensions: 38cm x 32cm x 12cm"]
  }
];

// Read/write store
interface DBStore {
  users: any[];
  orders: any[];
  products: any[];
}

function readStore(): DBStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return {
        users: parsed.users || [],
        orders: parsed.orders || [],
        products: parsed.products || []
      };
    }
  } catch (err) {
    console.error("Error reading store:", err);
  }
  return { users: [], orders: [], products: [] };
}

function writeStore(store: DBStore) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing store:", err);
  }
}

// Background Shipping simulation loop: advance any active order every 90 seconds
setInterval(() => {
  const store = readStore();
  let updated = false;

  const statuses: ("placed" | "processing" | "shipped" | "out_for_delivery" | "delivered")[] = [
    "placed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered"
  ];

  store.orders = store.orders.map((order) => {
    if (order.status !== "delivered") {
      const currentIndex = statuses.indexOf(order.status);
      if (currentIndex !== -1 && currentIndex < statuses.length - 1) {
        const nextStatus = statuses[currentIndex + 1];
        order.status = nextStatus;

        // Generate dynamic location and update description
        const nextUpdate = getPresetUpdateForStatus(nextStatus, order.shippingAddress.city, order.items[0]?.product?.name);
        order.trackingUpdates.unshift(nextUpdate);
        updated = true;
      }
    }
    return order;
  });

  if (updated) {
    writeStore(store);
    console.log("Background shipping simulation: orders updated.");
  }
}, 90000);

// Helper for preset updates
function getPresetUpdateForStatus(status: string, city: string, productName: string) {
  const nowStr = new Date().toISOString();
  switch (status) {
    case "processing":
      return {
        timestamp: nowStr,
        status: "processing",
        location: "Jaffe atelier, Paris",
        description: `Your ${productName || "item"} is being meticulously prepared, wrapped in fine cotton dustcovers, and placed in our hallmark keepsake box.`
      };
    case "shipped":
      return {
        timestamp: nowStr,
        status: "shipped",
        location: "Charles de Gaulle Hub, France",
        description: "The package has been verified and released by dispatch. Transporting via expedited air carrier to country of destination."
      };
    case "out_for_delivery":
      return {
        timestamp: nowStr,
        status: "out_for_delivery",
        location: `${city} Distribution Centre`,
        description: `Dispatched to Jaffe courier for local delivery. Arrival expected between 09:00 and 18:00 today.`
      };
    case "delivered":
      return {
        timestamp: nowStr,
        status: "delivered",
        location: `${city}, Destination Address`,
        description: "Delivered. Hand-signed and left with customer at residence. Thank you for choosing Jaffe."
      };
    default:
      return {
        timestamp: nowStr,
        status: "placed",
        location: "Jaffe digital registry",
        description: "Order received and payment authorized."
      };
  }
}

// API Routes

// Get Products
app.get("/api/products", (req, res) => {
  const store = readStore();
  const allProducts = [...PRODUCTS, ...store.products];
  res.json(allProducts);
});

// Create (Sell) Product
app.post("/api/products/create", (req, res) => {
  const { name, description, price, category, imageUrl, brandName, sizes, colors, details, sellerPhone } = req.body;
  if (!name || !price || !description || !brandName) {
    return res.status(400).json({ error: "Missing required product details (Title, Price, Description, and Brand are required)." });
  }

  const store = readStore();
  const newProduct = {
    id: "prod-" + crypto.randomUUID(),
    name,
    description,
    price: parseFloat(price),
    category: category || "apparel",
    imageUrl: imageUrl || "https://picsum.photos/seed/" + encodeURIComponent(name) + "/600/800",
    brandName,
    sizes: sizes || ["S", "M", "L", "XL"],
    colors: colors || ["Noir", "Graphite"],
    stock: 10,
    details: details || ["100% Sustainable brand garment", "Tailored to high structural quality", "Exquisite designer finish"],
    sellerPhone: sellerPhone || ""
  };

  store.products.unshift(newProduct);
  writeStore(store);

  res.status(201).json(newProduct);
});

// Auth
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, phone, address } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const store = readStore();
  const existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Email already registered" });
  }

  // Pure Node native crypto password hash
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");

  const user = {
    id: crypto.randomUUID(),
    email,
    passwordHash: hash,
    passwordSalt: salt,
    name,
    phone: phone || "",
    shippingAddress: address || null,
    joinedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })
  };

  store.users.push(user);
  writeStore(store);

  // Exclude sensitive data
  const { passwordHash, passwordSalt, ...userSafe } = user;
  const token = crypto.randomBytes(32).toString("hex");

  // Keep token linked to user id in-memory or store in a simple session object
  // For simplicity, we can return the token and store user session
  res.json({ user: userSafe, token });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const store = readStore();
  const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const hash = crypto.pbkdf2Sync(password, user.passwordSalt, 1000, 64, "sha512").toString("hex");
  if (hash !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const { passwordHash, passwordSalt, ...userSafe } = user;
  const token = crypto.randomBytes(32).toString("hex");

  res.json({ user: userSafe, token });
});

// Google Authentication
app.post("/api/auth/google", (req, res) => {
  const { email, name, avatarUrl } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Google email and name are required" });
  }

  const store = readStore();
  let user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Register new Google user
    const salt = crypto.randomBytes(16).toString("hex");
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hash = crypto.pbkdf2Sync(randomPassword, salt, 1000, 64, "sha512").toString("hex");

    user = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
      name,
      phone: "",
      shippingAddress: null,
      joinedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" }),
      avatarUrl: avatarUrl || ""
    };
    store.users.push(user);
    writeStore(store);
  } else {
    // Existing user logs in, sync avatarUrl if none exists
    if (avatarUrl && !user.avatarUrl) {
      user.avatarUrl = avatarUrl;
      writeStore(store);
    }
  }

  const { passwordHash, passwordSalt, ...userSafe } = user;
  const token = crypto.randomBytes(32).toString("hex");

  res.json({ user: userSafe, token });
});

// Update Profile
app.post("/api/profile/update", (req, res) => {
  const { userId, name, phone, shippingAddress, avatarUrl } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID required" });
  }

  const store = readStore();
  const userIndex = store.users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  store.users[userIndex].name = name || store.users[userIndex].name;
  store.users[userIndex].phone = phone !== undefined ? phone : store.users[userIndex].phone;
  store.users[userIndex].shippingAddress = shippingAddress !== undefined ? shippingAddress : store.users[userIndex].shippingAddress;
  store.users[userIndex].avatarUrl = avatarUrl !== undefined ? avatarUrl : store.users[userIndex].avatarUrl;

  writeStore(store);

  const { passwordHash, passwordSalt, ...userSafe } = store.users[userIndex];
  res.json({ user: userSafe });
});

// Orders
app.get("/api/orders", (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "User ID required" });
  }

  const store = readStore();
  const userOrders = store.orders.filter((o) => o.userId === userId);
  res.json(userOrders);
});

// Create Order
app.post("/api/orders/create", (req, res) => {
  const { userId, items, subtotal, shipping, tax, total, shippingAddress, paymentMethod } = req.body;
  if (!userId || !items || !shippingAddress) {
    return res.status(400).json({ error: "Missing order components" });
  }

  const store = readStore();

  const trackingNumber = "JF" + crypto.randomBytes(4).toString("hex").toUpperCase();
  const nowStr = new Date().toISOString();

  const firstItemName = items[0]?.product?.name || "luxury garment";

  const order = {
    id: "OR-" + Math.floor(Math.random() * 900000 + 100000),
    userId,
    items,
    subtotal,
    shipping,
    tax,
    total,
    status: "placed",
    shippingAddress,
    paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
    paymentMethod: paymentMethod || "sandbox",
    trackingNumber,
    trackingUpdates: [
      {
        timestamp: nowStr,
        status: "placed",
        location: "Jaffe Digital registry",
        description: `Order successfully placed and secured. Our artisans have been notified to retrieve your ${firstItemName}.`
      }
    ],
    createdAt: nowStr
  };

  store.orders.unshift(order);
  writeStore(store);

  res.json(order);
});

// Manually advance order status (for demonstration/developer sandbox control)
app.post("/api/orders/:id/advance", (req, res) => {
  const { id } = req.params;
  const store = readStore();
  const orderIndex = store.orders.findIndex((o) => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = store.orders[orderIndex];
  const statuses: ("placed" | "processing" | "shipped" | "out_for_delivery" | "delivered")[] = [
    "placed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered"
  ];

  const currentIndex = statuses.indexOf(order.status);
  if (currentIndex === -1 || currentIndex === statuses.length - 1) {
    return res.json(order); // Already delivered
  }

  const nextStatus = statuses[currentIndex + 1];
  order.status = nextStatus;

  const update = getPresetUpdateForStatus(nextStatus, order.shippingAddress.city, order.items[0]?.product?.name);
  order.trackingUpdates.unshift(update);

  store.orders[orderIndex] = order;
  writeStore(store);

  res.json(order);
});

// AI Shipping Updates powered by Gemini
app.post("/api/orders/:id/generate-ai-log", async (req, res) => {
  const { id } = req.params;
  const { customLocation } = req.body;

  const store = readStore();
  const orderIndex = store.orders.findIndex((o) => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = store.orders[orderIndex];

  if (!ai) {
    // Return a highly premium local fallback description if Gemini is not set up
    const locations = ["Atelier Milan", "Changi Depot", "Frankfurt Transit Hub", "Munich Logistical Facility"];
    const fallbackLocation = customLocation || locations[Math.floor(Math.random() * locations.length)];
    const fallbackUpdate = {
      timestamp: new Date().toISOString(),
      status: order.status,
      location: fallbackLocation,
      description: `[Artisan Log] Shipments checked into ${fallbackLocation}. Signature luxury alignment verified, secure tracking seals active.`
    };
    order.trackingUpdates.unshift(fallbackUpdate);
    store.orders[orderIndex] = order;
    writeStore(store);
    return res.json(order);
  }

  try {
    const productName = order.items[0]?.product?.name || "garment";
    const status = order.status;
    const destCity = order.shippingAddress.city;

    const prompt = `You are the chief concierge for the luxury minimalist fashion brand Jaffe (JAFFE).
Write a brief, highly professional, sophisticated courier tracking description (maximum 2 sentences) for an order update.
Product purchased: ${productName}.
Current tracking status: ${status}.
Destination city: ${destCity}.
Context location: ${customLocation || "Transit sorting facility"}.
Avoid typical standard delivery jargon. Write in an elegant, poetic yet precise, ultra-luxe brand voice (e.g. referencing Jaffe garments packaged in fine linens, white-glove transport, bespoke transit logs, carbon-neutral shipping).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const aiDescription = response.text?.trim() || "The parcel has transitioned securely to the next terminal in our verified luxury courier network.";

    const newUpdate = {
      timestamp: new Date().toISOString(),
      status: order.status,
      location: customLocation || "Jaffe Global Logistics Center",
      description: aiDescription
    };

    order.trackingUpdates.unshift(newUpdate);
    store.orders[orderIndex] = order;
    writeStore(store);

    res.json(order);
  } catch (err) {
    console.error("Gemini failed to generate tracking description:", err);
    // Fallback
    const fallbackUpdate = {
      timestamp: new Date().toISOString(),
      status: order.status,
      location: customLocation || "Jaffe Air Cargo Hub",
      description: "Shipment arrived at international sort center. White-glove handling and tracking tags confirmed."
    };
    order.trackingUpdates.unshift(fallbackUpdate);
    store.orders[orderIndex] = order;
    writeStore(store);
    res.json(order);
  }
});

// Stripe Payment Gateway Integration
app.post("/api/stripe/create-payment-intent", async (req, res) => {
  const { amount, currency } = req.body;
  if (!amount) {
    return res.status(400).json({ error: "Amount required" });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    // Secure Sandbox payment flow if key is omitted
    return res.json({
      clientSecret: "jaffe_sandbox_secret_" + crypto.randomBytes(8).toString("hex"),
      mode: "sandbox",
      message: "Stripe API Key is not configured. Jaffe is running in offline Sandbox Payment Mode."
    });
  }

  try {
    const stripe = new Stripe(stripeKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: currency || "usd",
      metadata: { brand: "Jaffe" }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      mode: "live"
    });
  } catch (err: any) {
    console.error("Stripe payment intent creation failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend build files in production or hook Vite in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
