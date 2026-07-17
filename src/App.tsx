import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, ShoppingBag, ArrowRight, ShieldCheck, HelpCircle, X, Check, Lock, Loader2, RefreshCw, MessageCircle } from "lucide-react";
import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import CartDrawer from "./components/CartDrawer";
import AuthModal from "./components/AuthModal";
import PaymentModal from "./components/PaymentModal";
import ProfileView from "./components/ProfileView";
import OrderTracker from "./components/OrderTracker";
import SellProductView from "./components/SellProductView";
import Logo from "./components/Logo";
import { User, Product, CartItem, Order, Address } from "./types";

export default function App() {
  // Navigation & Views
  const [currentView, setCurrentView] = useState<"shop" | "sell" | "profile" | "tracking">("shop");
  
  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const modalScrollRef = React.useRef<HTMLDivElement>(null);
  
  // Cart & Order State (hydrated from LocalStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("jaffe_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("jaffe_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [orders, setOrders] = useState<Order[]>([]);

  // UI Control states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);

  // Loadings
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Persist Cart
  useEffect(() => {
    localStorage.setItem("jaffe_cart", JSON.stringify(cart));
  }, [cart]);

  // Persist User
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("jaffe_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("jaffe_user");
    }
  }, [currentUser]);

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch Orders for the current user
  const fetchOrders = useCallback(async (userId: string) => {
    if (!userId) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Load orders when user changes
  const currentUserId = currentUser?.id;
  useEffect(() => {
    if (currentUserId) {
      fetchOrders(currentUserId);
    } else {
      setOrders([]);
    }
  }, [currentUserId, fetchOrders]);

  // Handle Auth success
  const handleAuthSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem("jaffe_token", token);
  };

  // Add item to cart
  const handleAddToCart = (product: Product, size?: string, color?: string) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );

      if (existingIdx !== -1) {
        const updated = [...prevCart];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [...prevCart, { product, quantity: 1, selectedSize: size, selectedColor: color }];
      }
    });
  };

  // Update item quantity in cart
  const handleUpdateQuantity = (productId: string, delta: number, size?: string, color?: string) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (
            item.product.id === productId &&
            item.selectedSize === size &&
            item.selectedColor === color
          ) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  // Remove item from cart
  const handleRemoveItem = (productId: string, size?: string, color?: string) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedSize === size &&
            item.selectedColor === color
          )
      )
    );
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("jaffe_user");
    localStorage.removeItem("jaffe_token");
    setOrders([]);
    setCurrentView("shop");
  };

  // Profile Update
  const handleUpdateProfile = async (name: string, phone: string, address: Address, avatarUrl?: string) => {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, name, phone, shippingAddress: address, avatarUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Profile update failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Navigate to tracking for a specific order
  const handleTrackOrder = (order: Order) => {
    setLastCreatedOrder(order);
    setCurrentView("tracking");
  };

  // Checkout click
  const handleCheckout = () => {
    if (!currentUser) {
      setIsCartOpen(false);
      setIsAuthOpen(true);
    } else {
      setIsCartOpen(false);
      setIsPaymentOpen(true);
    }
  };

  // Payment Success callback -> Create real order on backend
  const handlePaymentSuccess = async (
    method: "stripe" | "sandbox" | "cod",
    shippingFee: number,
    shippingMethod: string,
    shippingAddress: Address
  ) => {
    if (!currentUser || cart.length === 0) return;

    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + shippingFee + tax;

    const payload = {
      userId: currentUser.id,
      items: cart,
      subtotal,
      shipping: shippingFee,
      tax,
      total,
      shippingAddress,
      paymentMethod: method,
    };

    setActionLoading(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const order = await res.json();
        setCart([]); // Clear cart
        setLastCreatedOrder(order);
        setOrders((prev) => [order, ...prev]);

        // Launch celebratory overlay
        setIsCelebrationOpen(true);
        setTimeout(() => {
          setIsCelebrationOpen(false);
          setCurrentView("tracking"); // Navigate to live tracking
        }, 3200);
      }
    } catch (err) {
      console.error("Failed to create order:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Advance Order simulated step
  const handleAdvanceOrder = async (orderId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/advance`, {
        method: "POST",
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
        setLastCreatedOrder(updatedOrder);
      }
    } catch (err) {
      console.error("Failed to advance order:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Generate Custom Gemini AI Log
  const handleGenerateAILog = async (orderId: string, customLocation: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/generate-ai-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customLocation }),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
        setLastCreatedOrder(updatedOrder);
      }
    } catch (err) {
      console.error("Failed to generate AI log:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const cartTotalAmount = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const checkoutAmount = cartTotalAmount + (cartTotalAmount > 500 ? 0 : 25) + cartTotalAmount * 0.08;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans selection:bg-black selection:text-white">
      
      {/* Header element */}
      <Header
        currentUser={currentUser}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onNavigate={setCurrentView}
        currentView={currentView}
      />

      {/* Main Container Stage */}
      <main className="flex-grow">
        
        {/* VIEW 1: SHOP CATALOGUE */}
        {currentView === "shop" && (
          <div className="animate-fade-in" id="shop-catalog-view">
            
            {/* Minimalist Editorial Hero Banner */}
            <section className="border-b border-neutral-100 py-16 sm:py-24 bg-neutral-50 flex items-center justify-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                <div className="inline-flex items-center space-x-2 border border-black/10 px-3.5 py-1 text-[9px] font-semibold tracking-[0.25em] text-neutral-500 uppercase rounded-full bg-white">
                  <span>ATELIER COLLECTION 2026</span>
                </div>
                
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-sans font-extrabold text-black tracking-tighter uppercase leading-none max-w-4xl mx-auto">
                  The Architecture of Restraint
                </h1>
                
                <p className="font-sans text-xs sm:text-sm text-neutral-500 tracking-wide max-w-xl mx-auto leading-relaxed">
                  Structured forms. Sharp, monochrome contrasts. Hand-finished details meticulously prepared in our Paris atelier. Experience absolute luxurious minimalist clothing.
                </p>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      const el = document.getElementById("collection-grid");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-black hover:bg-neutral-800 text-white text-[10px] font-semibold tracking-widest uppercase px-8 py-3.5 border border-black hover:border-black hover:text-white transition-all duration-300 flex items-center space-x-2 mx-auto shadow-md"
                  >
                    <span>EXPLORE THE ESSENTIALS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>

            {/* Core Products Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="collection-grid">
              
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-neutral-100 pb-5 mb-10 gap-2">
                <div>
                  <h2 className="font-sans text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">
                    Curated Garments & Horology
                  </h2>
                  <p className="font-sans text-xl font-medium tracking-wider text-black uppercase mt-1">
                    Atelier Essentials
                  </p>
                </div>
                <div className="flex space-x-4 text-[10px] font-semibold tracking-widest uppercase text-neutral-400">
                  <span className="text-black border-b border-black pb-1">All Items</span>
                  <span className="hover:text-black cursor-pointer transition-colors">Apparel</span>
                  <span className="hover:text-black cursor-pointer transition-colors">Accessories</span>
                  <span className="hover:text-black cursor-pointer transition-colors">Footwear</span>
                </div>
              </div>

              {loadingProducts ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-black" />
                  <p className="text-xs font-sans tracking-widest text-neutral-400 uppercase">Acquiring Catalogue...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {products.map((prod) => (
                    <div 
                      key={prod.id} 
                      onClick={() => setSelectedProduct(prod)} 
                      className="cursor-pointer"
                    >
                      <ProductCard
                        product={prod}
                        onAddToCart={(p, sz, cl) => {
                          handleAddToCart(p, sz, cl);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
            
            {/* Elegant Brand Credo Banner */}
            <section className="bg-black text-white py-20 border-t border-black">
              <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
                <Logo className="w-12 h-12 mx-auto" light={true} />
                <h3 className="font-sans text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">
                  THE JAFFE PROMISE
                </h3>
                <p className="font-sans text-base sm:text-lg italic tracking-wide max-w-2xl mx-auto leading-relaxed text-neutral-300">
                  "True craftsmanship does not shout. It is the perfect convergence of geometry, pristine materials, and silent competence. Every order is a custom pact of trust."
                </p>
                <div className="h-0.5 w-12 bg-white/20 mx-auto" />
                <p className="font-sans text-[10px] text-neutral-500 tracking-[0.2em] uppercase">
                  Paris • Milan • Tokyo
                </p>
              </div>
            </section>

          </div>
        )}

        {/* VIEW 2: USER PROFILE & ORDERS ARCHIVE */}
        {currentView === "profile" && currentUser && (
          <div className="animate-fade-in">
            <ProfileView
              currentUser={currentUser}
              orders={orders}
              onUpdateProfile={handleUpdateProfile}
              onTrackOrder={handleTrackOrder}
              onLogout={handleLogout}
              loading={actionLoading}
            />
          </div>
        )}

        {/* VIEW: CONSIGN & SELL CUSTOM CREATION */}
        {currentView === "sell" && (
          <div className="animate-fade-in">
            <SellProductView
              onProductCreated={(newProduct) => {
                setProducts((prev) => [newProduct, ...prev]);
                setCurrentView("shop");
              }}
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          </div>
        )}

        {/* VIEW 3: REAL-TIME SHIPPING TIMELINE */}
        {currentView === "tracking" && (
          <div className="animate-fade-in">
            <OrderTracker
              orders={orders}
              onAdvanceOrder={handleAdvanceOrder}
              onGenerateAILog={handleGenerateAILog}
              loadingAction={actionLoading}
            />
          </div>
        )}

      </main>

      {/* Footer Details */}
      <footer className="border-t border-neutral-100 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-neutral-100">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Logo className="w-6 h-6" />
                <span className="font-sans text-sm font-semibold tracking-[0.2em] text-black">JAFFE</span>
              </div>
              <p className="font-sans text-[11px] text-neutral-400 leading-relaxed uppercase tracking-wider">
                Luxury minimalist fashion house centered on the aesthetic of complete restraint.
              </p>
            </div>
            
            <div>
              <h5 className="font-sans text-[10px] font-semibold tracking-[0.2em] text-black uppercase mb-3">Atelier</h5>
              <ul className="space-y-1.5 text-[11px] text-neutral-500 uppercase tracking-wide">
                <li className="hover:text-black cursor-pointer">Bespoke Fitting</li>
                <li className="hover:text-black cursor-pointer">Sartorial Repair</li>
                <li className="hover:text-black cursor-pointer">Private Collection</li>
                <li className="hover:text-black cursor-pointer">Atelier Map</li>
              </ul>
            </div>

            <div>
              <h5 className="font-sans text-[10px] font-semibold tracking-[0.2em] text-black uppercase mb-3">Concierge</h5>
              <ul className="space-y-1.5 text-[11px] text-neutral-500 uppercase tracking-wide">
                <li className="hover:text-black cursor-pointer">Shipping & Returns</li>
                <li className="hover:text-black cursor-pointer font-semibold text-black" onClick={() => setCurrentView("tracking")}>Track Order</li>
                <li className="hover:text-black cursor-pointer">Payment Gateways</li>
                <li className="hover:text-black cursor-pointer">Contact Us</li>
              </ul>
            </div>

            <div>
              <h5 className="font-sans text-[10px] font-semibold tracking-[0.2em] text-black uppercase mb-3">Corporate</h5>
              <ul className="space-y-1.5 text-[11px] text-neutral-500 uppercase tracking-wide">
                <li className="hover:text-black cursor-pointer">Sustainability</li>
                <li className="hover:text-black cursor-pointer">Artistic Direction</li>
                <li className="hover:text-black cursor-pointer">Carrers</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-neutral-400 uppercase tracking-widest gap-4">
            <p>© {new Date().getFullYear()} Jaffe Atelier Ltd. All rights reserved.</p>
            <div className="flex space-x-6">
              <span className="hover:text-black cursor-pointer">Privacy Policy</span>
              <span className="hover:text-black cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL 1: PRODUCT DETAIL IMMERSIVE MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" id="product-detail-modal">
          <div 
            ref={modalScrollRef}
            className="relative bg-white border border-neutral-100 max-w-3xl w-full p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-[3/4] bg-neutral-50 overflow-hidden border border-neutral-100">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover filter grayscale-[10%]"
                />
              </div>

              <div className="flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 font-mono">
                      {selectedProduct.category}
                    </span>
                    {selectedProduct.brandName && (
                      <span className="text-[9px] uppercase tracking-wider text-black font-bold bg-neutral-100 px-2 py-0.5">
                        {selectedProduct.brandName}
                      </span>
                    )}
                  </div>
                  <h3 className="font-sans text-lg font-medium tracking-wide text-neutral-900">
                    {selectedProduct.name}
                  </h3>
                  <span className="font-mono text-base font-semibold text-black block">
                    Rs. {selectedProduct.price.toLocaleString()}
                  </span>
                  
                  <p className="font-sans text-xs text-neutral-500 leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  <div className="pt-4 border-t border-neutral-100">
                    <span className="block text-[10px] text-neutral-400 tracking-widest font-mono uppercase mb-2">Specifications</span>
                    <ul className="list-disc pl-4 space-y-1 text-neutral-500 text-[11px] uppercase tracking-wider">
                      {selectedProduct.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 space-y-3">
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setSelectedProduct(null);
                      setIsCartOpen(true);
                    }}
                    className="w-full bg-black text-white hover:bg-neutral-800 text-xs font-semibold tracking-widest uppercase py-4 border border-black transition-colors flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>SECURE ACQUISITION</span>
                  </button>

                  <button
                    onClick={() => {
                      const number = selectedProduct.sellerPhone || "923330000000";
                      const cleanNum = number.replace(/\D/g, "");
                      const msg = `Hello! I am interested in buying *${selectedProduct.name}* (${selectedProduct.brandName || "Atelier"}).\nCategory: ${selectedProduct.category}\nPrice: Rs. ${selectedProduct.price.toLocaleString()}\n\nIs this garment available for purchase?`;
                      window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold tracking-widest uppercase py-4 transition-colors flex items-center justify-center space-x-2 shadow-md"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span>BUY VIA WHATSAPP CHAT</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SIMILAR PRODUCTS SECTION */}
            {(() => {
              const similarProducts = products
                .filter((p) => p.category === selectedProduct.category && p.id !== selectedProduct.id)
                .slice(0, 3);

              if (similarProducts.length === 0) return null;

              return (
                <div className="mt-12 pt-8 border-t border-neutral-100" id="similar-products-section">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-sans text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
                      SIMILAR PRODUCTS
                    </h4>
                    <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
                      SUGGESTIONS FROM {selectedProduct.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {similarProducts.map((similar) => (
                      <div
                        key={similar.id}
                        onClick={() => {
                          setSelectedProduct(similar);
                          modalScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="group cursor-pointer border border-neutral-100 hover:border-neutral-200 p-3 bg-white transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="aspect-[3/4] bg-neutral-50 overflow-hidden border border-neutral-100/50 mb-3">
                            <img
                              src={similar.imageUrl}
                              alt={similar.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover filter grayscale-[10%] group-hover:scale-[1.03] transition-transform duration-300"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[8px] uppercase tracking-widest text-neutral-400 font-mono">
                              {similar.category}
                            </span>
                            {similar.brandName && (
                              <span className="text-[8px] uppercase tracking-wider text-black font-semibold bg-neutral-100 px-1.5 py-0.5">
                                {similar.brandName}
                              </span>
                            )}
                          </div>

                          <h5 className="font-sans text-xs text-neutral-800 font-medium group-hover:text-black transition-colors line-clamp-1">
                            {similar.name}
                          </h5>
                        </div>

                        <span className="font-mono text-[11px] text-neutral-600 block mt-2.5">
                          Rs. {similar.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* Cart Drawer element */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      {/* Auth Modal element */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Stripe Payment Gateway handshaker modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        subtotal={cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)}
        initialAddress={currentUser?.shippingAddress}
        initialPhone={currentUser?.phone}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* MODAL 3: MINIMALIST SUCCESS CELEBRATION GATE */}
      {isCelebrationOpen && (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center p-6 animate-fade-in" id="celebration-overlay">
          <div className="text-center space-y-6 max-w-md">
            
            {/* Animated Monogram spinner */}
            <div className="relative w-24 h-24 mx-auto mb-4 animate-pulse">
              <Logo className="w-24 h-24" light={true} />
            </div>

            <div className="space-y-2">
              <span className="font-sans text-[10px] text-neutral-400 tracking-[0.4em] uppercase block">
                Transaction Verified
              </span>
              <h2 className="font-sans text-2xl font-bold tracking-widest uppercase text-white">
                ORDER ACQUIRED
              </h2>
              <p className="font-sans text-xs text-neutral-400 tracking-wider">
                We have secured your payment. Your shipment tracking code is being written to our registry.
              </p>
            </div>

            <div className="h-[2px] w-12 bg-white/30 mx-auto" />

            <div className="flex items-center justify-center space-x-3 text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-white stroke-[2]" />
              <span>COURIER DISPATCH ENGAGED</span>
            </div>

            {lastCreatedOrder && (
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded text-center font-mono text-[10px] space-y-1 max-w-xs mx-auto text-neutral-300">
                <p className="text-neutral-500">TRACKING NUMBER</p>
                <p className="text-white font-bold text-xs tracking-widest">{lastCreatedOrder.trackingNumber}</p>
                <p className="text-neutral-500 mt-2">REDIRECTING TO LIVE MAPS...</p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
