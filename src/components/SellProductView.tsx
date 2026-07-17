import React, { useState, useEffect } from "react";
import { Upload, Sparkles, Check, HelpCircle, ArrowRight, Loader2, Plus, X, Image as ImageIcon } from "lucide-react";
import { Product } from "../types";

interface SellProductViewProps {
  onProductCreated: (product: Product) => void;
  currentUser: { name: string; id: string; phone?: string } | null;
  onOpenAuth: () => void;
}

const LUXURY_PRESETS = [
  {
    name: "Classic Minimalist Trench",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop",
    category: "apparel",
    brandName: "Maison Restraint"
  },
  {
    name: "Architectural Leather Boot",
    imageUrl: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=600&auto=format&fit=crop",
    category: "footwear",
    brandName: "Atelier Solaire"
  },
  {
    name: "Chrono-Stealth Watch",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop",
    category: "accessories",
    brandName: "Horology Noir"
  },
  {
    name: "Structured Canvas Tote",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop",
    category: "accessories",
    brandName: "Maison Restraint"
  }
];

export default function SellProductView({
  onProductCreated,
  currentUser,
  onOpenAuth,
}: SellProductViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formStep, setFormStep] = useState<"details" | "picture">("details");

  // Form Fields
  const [title, setTitle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<"apparel" | "accessories" | "footwear">("apparel");
  const [description, setDescription] = useState("");
  const [imageType, setImageType] = useState<"upload" | "url" | "presets">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedBase64, setUploadedBase64] = useState("");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);
  const [sellerPhone, setSellerPhone] = useState("");

  useEffect(() => {
    if (currentUser?.phone) {
      setSellerPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Specifications/Details
  const [detailInput, setDetailInput] = useState("");
  const [details, setDetails] = useState<string[]>([
    "Hand-finished tailored edges",
    "Made with sustainably sourced materials"
  ]);

  // Sizes & Colors
  const [sizes, setSizes] = useState<string[]>(["S", "M", "L"]);
  const [colors, setColors] = useState<string[]>(["Midnight Noir", "Chalk White"]);
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size exceeds 2MB limit. Please upload a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedBase64(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please drop a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size exceeds 2MB limit. Please upload a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedBase64(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleAddDetail = () => {
    if (detailInput.trim()) {
      setDetails([...details, detailInput.trim()]);
      setDetailInput("");
    }
  };

  const handleRemoveDetail = (idx: number) => {
    setDetails(details.filter((_, i) => i !== idx));
  };

  const handleAddSize = () => {
    if (newSize.trim() && !sizes.includes(newSize.trim().toUpperCase())) {
      setSizes([...sizes, newSize.trim().toUpperCase()]);
      setNewSize("");
    }
  };

  const handleAddColor = () => {
    if (newColor.trim() && !colors.includes(newColor.trim())) {
      setColors([...colors, newColor.trim()]);
      setNewColor("");
    }
  };

  const handleNextStep = () => {
    if (!brandName.trim()) {
      setError("Please enter a Garment Brand Name.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a Creation Title.");
      return;
    }
    if (!price.trim() || parseFloat(price) <= 0) {
      setError("Please enter a valid price in Rs.");
      return;
    }
    if (!sellerPhone.trim()) {
      setError("Please enter your WhatsApp Phone Number.");
      return;
    }
    if (!description.trim()) {
      setError("Please write a sartorial description.");
      return;
    }
    setError("");
    setFormStep("picture");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setLoading(true);
    setError("");

    let finalImageUrl = "";
    if (imageType === "upload") {
      finalImageUrl = uploadedBase64 || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop";
    } else if (imageType === "url") {
      finalImageUrl = imageUrl || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop";
    } else if (imageType === "presets" && selectedPresetIndex !== null) {
      finalImageUrl = LUXURY_PRESETS[selectedPresetIndex].imageUrl;
    } else {
      finalImageUrl = "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop";
    }

    try {
      const response = await fetch("/api/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title,
          description,
          price: parseFloat(price),
          category,
          imageUrl: finalImageUrl,
          brandName,
          sizes,
          colors,
          details,
          sellerPhone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to list item on registry.");
      }

      setSuccess(true);
      onProductCreated(data);
      setFormStep("details");

      // Clear Form
      setTitle("");
      setBrandName("");
      setPrice("");
      setDescription("");
      setUploadedBase64("");
      setImageUrl("");
      setSelectedPresetIndex(null);

      setTimeout(() => {
        setSuccess(false);
      }, 3500);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during registry write.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = LUXURY_PRESETS[index];
    setTitle(preset.name);
    setBrandName(preset.brandName);
    setCategory(preset.category as any);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12" id="sell-atelier-view">
      
      {/* Editorial Header */}
      <div className="text-center mb-12 space-y-3">
        <span className="font-sans text-[10px] text-neutral-400 tracking-[0.3em] uppercase block">
          Consignment & Peer Listing
        </span>
        <h2 className="font-sans text-2xl font-bold tracking-widest text-black uppercase">
          LIST AN ATELIER CREATION
        </h2>
        <div className="h-0.5 w-12 bg-black mx-auto" />
        <p className="font-sans text-xs text-neutral-500 max-w-lg mx-auto leading-relaxed">
          Introduce your custom tailoring, limited consignment items, or pre-loved garments to Jaffe's global ledger.Meticulously designed, hand-approved peer-to-peer commerce.
        </p>
      </div>

      {!currentUser ? (
        <div className="bg-neutral-50 border border-neutral-100 p-10 text-center space-y-6">
          <HelpCircle className="w-10 h-10 mx-auto text-neutral-400 stroke-[1.5]" />
          <div className="space-y-2">
            <h4 className="font-sans text-xs font-semibold tracking-widest text-black uppercase">
              Authentication Required
            </h4>
            <p className="font-sans text-[11px] text-neutral-400 max-w-sm mx-auto leading-relaxed">
              You must register or log into your premium Jaffe Atelier Account to list garments and capture digital smart-contract balances.
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="bg-black hover:bg-neutral-800 text-white text-[10px] font-semibold tracking-widest uppercase px-6 py-3 transition-colors"
          >
            ENTER THE ATELIER
          </button>
        </div>
      ) : (
        <div className="bg-white border border-neutral-100 p-8 shadow-sm">
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-xs p-4 mb-8 flex items-center">
              <Check className="w-5 h-5 mr-2 stroke-[2.5]" />
              <div className="font-sans">
                <span className="font-bold block uppercase tracking-wide">GARMENT COMMITTED TO REGISTRY</span>
                <span>Your masterpiece has been coded into the database. It is now live in our Collection.</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs p-4 mb-8 font-sans">
              {error}
            </div>
          )}

          {/* Step Progress Indicators */}
          <div className="flex items-center justify-center space-x-4 sm:space-x-8 mb-8 pb-6 border-b border-neutral-100 font-sans text-[10px] tracking-widest font-bold uppercase">
            <button
              type="button"
              onClick={() => setFormStep("details")}
              className={`pb-1 border-b-2 transition-all ${
                formStep === "details" ? "border-black text-black" : "border-transparent text-neutral-400"
              }`}
            >
              1. GARMENT DETAILS (Rs. PRICE, DESC)
            </button>
            <span className="text-neutral-300">→</span>
            <button
              type="button"
              disabled={formStep === "details"}
              onClick={() => setFormStep("picture")}
              className={`pb-1 border-b-2 transition-all ${
                formStep === "picture" ? "border-black text-black" : "border-transparent text-neutral-400 font-normal"
              }`}
            >
              2. PICTURE UPLOAD & SELL
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {formStep === "details" && (
              <div className="space-y-8 animate-fade-in">
                {/* Core details row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                      GARMENT BRAND NAME *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maison Restraint"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                      CREATION TITLE / NAME *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Silk Wrap Dress"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase transition-colors"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                      RETAIL PRICE (Rs.) *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 font-mono text-xs">
                        Rs.
                      </span>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="25000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                      COLLECTION CATEGORY *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase tracking-wider h-11 transition-colors"
                    >
                      <option value="apparel">Apparel</option>
                      <option value="accessories">Accessories</option>
                      <option value="footwear">Footwear</option>
                    </select>
                  </div>

                </div>

                {/* WhatsApp Contact */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                    SELLER WHATSAPP PHONE NUMBER (FOR INSTANT CHAT) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 923001234567"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black transition-colors"
                  />
                  <span className="block text-[9px] text-neutral-400 font-sans uppercase tracking-wider pt-1">
                    Customers will be redirected to WhatsApp to chat with you directly when they click the Buy option.
                  </span>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                    SARTORIAL DESCRIPTION *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe the architectural form, material cuts, and sensory qualities of this garment..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Custom attributes (Sizes, colors, specifications) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-neutral-100">
                  
                  {/* Sizes & Colors inputs */}
                  <div className="space-y-6">
                    
                    {/* Sizes list builder */}
                    <div className="space-y-2">
                      <span className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                        AVAILABLE SIZES
                      </span>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {sizes.map((s) => (
                          <span key={s} className="px-2.5 py-1 bg-neutral-50 border border-neutral-200 text-[10px] font-mono font-semibold uppercase flex items-center">
                            {s}
                            <button
                              type="button"
                              onClick={() => setSizes(sizes.filter((size) => size !== s))}
                              className="ml-1.5 text-neutral-400 hover:text-black"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. XXL"
                          value={newSize}
                          onChange={(e) => setNewSize(e.target.value)}
                          className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 text-xs font-mono uppercase focus:outline-none focus:border-black max-w-[120px]"
                        />
                        <button
                          type="button"
                          onClick={handleAddSize}
                          className="px-3 border border-black text-black hover:bg-black hover:text-white transition-colors text-[9px] font-semibold uppercase tracking-wider"
                        >
                          ADD SIZE
                        </button>
                      </div>
                    </div>

                    {/* Colors list builder */}
                    <div className="space-y-2">
                      <span className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                        COLORS ARCHIVE
                      </span>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {colors.map((c) => (
                          <span key={c} className="px-2.5 py-1 bg-neutral-50 border border-neutral-200 text-[10px] font-sans font-semibold uppercase flex items-center">
                            {c}
                            <button
                              type="button"
                              onClick={() => setColors(colors.filter((col) => col !== c))}
                              className="ml-1.5 text-neutral-400 hover:text-black"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Sage Green"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 text-xs font-sans uppercase focus:outline-none focus:border-black max-w-[140px]"
                        />
                        <button
                          type="button"
                          onClick={handleAddColor}
                          className="px-3 border border-black text-black hover:bg-black hover:text-white transition-colors text-[9px] font-semibold uppercase tracking-wider"
                        >
                          ADD COLOR
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Specifications checklist */}
                  <div className="space-y-4">
                    <span className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                      DESIGN SPECIFICATIONS & COMPOSITION
                    </span>
                    
                    <div className="space-y-2">
                      {details.map((detail, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-neutral-50 p-2.5 border border-neutral-200">
                          <span className="font-sans text-[11px] text-neutral-700 uppercase tracking-wide">
                            • {detail}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDetail(idx)}
                            className="text-neutral-400 hover:text-black font-bold text-xs px-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 100% cashmere, organic dye"
                        value={detailInput}
                        onChange={(e) => setDetailInput(e.target.value)}
                        className="flex-grow px-3 py-2 bg-neutral-50 border border-neutral-200 text-xs font-sans uppercase focus:outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={handleAddDetail}
                        className="px-4 border border-black bg-black text-white hover:bg-neutral-800 transition-colors text-[9px] font-semibold uppercase tracking-wider flex items-center"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> ADD SPEC
                      </button>
                    </div>
                  </div>

                </div>

                {/* Continue block */}
                <div className="pt-6 border-t border-neutral-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-black hover:bg-neutral-800 text-white text-[10px] font-semibold tracking-widest uppercase px-8 py-4.5 transition-colors flex items-center space-x-2"
                  >
                    <span>CONTINUE TO PICTURE UPLOAD</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}

            {formStep === "picture" && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Back Link Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <button
                    type="button"
                    onClick={() => setFormStep("details")}
                    className="text-neutral-500 hover:text-black text-[10px] font-semibold tracking-wider uppercase flex items-center space-x-1"
                  >
                    <span>← EDIT GARMENT DETAILS</span>
                  </button>
                  <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase">
                    STEP 2 OF 2
                  </span>
                </div>

                {/* Visual picture add option */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2">
                    <label className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                      PICTURE OPTION *
                    </label>
                    
                    <div className="flex space-x-2 text-[9px] font-semibold tracking-wider uppercase">
                      <button
                        type="button"
                        onClick={() => setImageType("upload")}
                        className={`px-3 py-1 border transition-colors ${
                          imageType === "upload" ? "bg-black text-white border-black" : "text-neutral-500 border-neutral-200 hover:border-black"
                        }`}
                      >
                        FILE UPLOAD
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageType("url")}
                        className={`px-3 py-1 border transition-colors ${
                          imageType === "url" ? "bg-black text-white border-black" : "text-neutral-500 border-neutral-200 hover:border-black"
                        }`}
                      >
                        IMAGE URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageType("presets")}
                        className={`px-3 py-1 border transition-colors ${
                          imageType === "presets" ? "bg-black text-white border-black" : "text-neutral-500 border-neutral-200 hover:border-black"
                        }`}
                      >
                        PRESETS
                      </button>
                    </div>
                  </div>

                  {imageType === "upload" && (
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="border-2 border-dashed border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 hover:border-black p-8 text-center transition-colors flex flex-col items-center justify-center min-h-[180px] relative cursor-pointer"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {uploadedBase64 ? (
                        <div className="space-y-2">
                          <img
                            src={uploadedBase64}
                            alt="Preview"
                            referrerPolicy="no-referrer"
                            className="w-20 h-24 object-cover mx-auto border border-neutral-100 shadow-sm"
                          />
                          <span className="block text-[10px] text-green-700 font-mono font-semibold uppercase">
                            IMAGE LOADED SUCCESSFULLY
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-6 h-6 text-neutral-400 mx-auto" />
                          <div className="space-y-1">
                            <span className="block text-xs font-semibold text-black uppercase tracking-wider">
                              DRAG & DROP IMAGE FILE
                            </span>
                            <span className="block text-[10px] text-neutral-400">
                              Supports PNG, JPG, WEBP up to 2MB
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {imageType === "url" && (
                    <div className="space-y-2 animate-fade-in">
                      <input
                        type="url"
                        placeholder="Paste a public high-resolution secure image URL"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black transition-colors"
                      />
                      <p className="text-[9px] text-neutral-400 font-sans uppercase tracking-wider">
                        Must begin with https:// to display correctly on modern secure browsers.
                      </p>
                    </div>
                  )}

                  {imageType === "presets" && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 animate-fade-in">
                      {LUXURY_PRESETS.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleApplyPreset(idx)}
                          className={`relative aspect-[3/4] overflow-hidden border cursor-pointer transition-all duration-300 ${
                            selectedPresetIndex === idx ? "border-black scale-95 shadow-md" : "border-neutral-200 hover:border-black"
                          }`}
                        >
                          <img
                            src={preset.imageUrl}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover filter grayscale-[10%]"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-2 opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-bold text-white uppercase tracking-wider truncate block w-full">
                              {preset.name}
                            </span>
                          </div>
                          {selectedPresetIndex === idx && (
                            <div className="absolute top-2 right-2 bg-black text-white p-1 rounded-full animate-scale-in">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Final step buttons */}
                <div className="pt-6 border-t border-neutral-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setFormStep("details")}
                    className="text-neutral-500 hover:text-black text-[10px] font-semibold tracking-wider uppercase"
                  >
                    ← BACK TO DETAILS
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-black hover:bg-neutral-800 text-white text-xs font-bold tracking-[0.2em] uppercase px-10 py-4.5 border border-black transition-all flex items-center space-x-2.5 shadow-lg animate-pulse-slow"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
                        <span>AUTHORIZE LEDGER WRITE & SELL NOW</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

          </form>

        </div>
      )}

    </div>
  );
}
