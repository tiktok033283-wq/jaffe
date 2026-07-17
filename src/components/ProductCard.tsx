import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, size?: string, color?: string) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes ? product.sizes[0] : ""
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors ? product.colors[0] : ""
  );
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize, selectedColor);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <div className="group flex flex-col bg-white border border-neutral-100 hover:border-black/10 transition-all duration-500 overflow-hidden" id={`product-card-${product.id}`}>
      
      {/* Product Image Stage */}
      <div className="relative aspect-[3/4] bg-neutral-50 overflow-hidden w-full">
        <img
          src={product.imageUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0"
        />

        {/* Stock Badge */}
        {product.stock <= 5 && (
          <span className="absolute top-4 left-4 bg-black text-white text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-1">
            Limited Edition
          </span>
        )}

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/25 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden sm:block">
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              disabled={product.stock === 0}
              className="flex-1 bg-white text-black text-[10px] font-semibold tracking-widest uppercase py-2.5 border border-transparent hover:bg-black hover:text-white transition-all duration-200 shadow-sm flex items-center justify-center space-x-1"
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2]" />
                  <span>ADDED</span>
                </>
              ) : product.stock === 0 ? (
                <span>OUT OF STOCK</span>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2]" />
                  <span>ADD TO BAG</span>
                </>
              )}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                const number = product.sellerPhone || "923330000000";
                const cleanNum = number.replace(/\D/g, "");
                const msg = `Hello! I want to buy *${product.name}* (${product.brandName || "Atelier"}).\nCategory: ${product.category}\nPrice: Rs. ${product.price.toLocaleString()}\n\nIs it available?`;
                window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`, "_blank");
              }}
              className="bg-[#25D366] hover:bg-[#20ba5a] text-white p-2.5 shadow-sm flex items-center justify-center transition-colors duration-200 rounded-sm"
              title="Buy via WhatsApp Chat"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.806-9.799.002-2.618-1.01-5.078-2.854-6.924C16.379 3.982 13.91 2.97 11.998 2.97c-5.41 0-9.813 4.403-9.815 9.811-.001 1.91.498 3.774 1.447 5.378L2.62 21.38l3.473-1.123.554-.313z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Product Description details */}
      <div className="p-5 flex flex-col flex-grow bg-white">
        
        {/* Category & Title */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-mono">
            {product.category}
          </span>
          {product.brandName && (
            <span className="text-[9px] uppercase tracking-wider text-black font-bold bg-neutral-100 px-2 py-0.5">
              {product.brandName}
            </span>
          )}
        </div>
        <h3 className="font-sans text-sm font-medium tracking-wide text-neutral-900 group-hover:text-black transition-colors mb-2">
          {product.name}
        </h3>
        
        <p className="font-sans text-xs text-neutral-500 line-clamp-2 mb-4 leading-relaxed flex-grow">
          {product.description}
        </p>

        {/* Selectors for Sizes / Colors */}
        <div className="space-y-3 pt-3 border-t border-neutral-100 mb-4">
          
          {/* Colors Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase">Color:</span>
              <div className="flex space-x-1.5">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedColor(color);
                    }}
                    className={`text-[9px] tracking-wider px-2 py-0.5 border transition-colors ${
                      selectedColor === color
                        ? "border-black text-black bg-neutral-50 font-medium"
                        : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase">Size:</span>
              <div className="flex space-x-1.5">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSize(size);
                    }}
                    className={`text-[9px] tracking-wider px-2 py-0.5 border transition-colors ${
                      selectedSize === size
                        ? "border-black text-black bg-neutral-50 font-medium"
                        : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Add Trigger for Mobile */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-mono text-sm font-semibold text-black">
            Rs. {product.price.toLocaleString()}
          </span>
          
          <div className="flex items-center space-x-2 sm:hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              disabled={product.stock === 0}
              className="text-xs font-semibold tracking-widest uppercase py-2 px-3 border border-black hover:bg-black hover:text-white transition-colors duration-200"
            >
              {isAdded ? "ADDED" : "ADD"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const number = product.sellerPhone || "923330000000";
                const cleanNum = number.replace(/\D/g, "");
                const msg = `Hello! I want to buy *${product.name}* (${product.brandName || "Atelier"}).\nCategory: ${product.category}\nPrice: Rs. ${product.price.toLocaleString()}\n\nIs it available?`;
                window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`, "_blank");
              }}
              className="bg-[#25D366] hover:bg-[#20ba5a] text-white p-2 transition-colors duration-200 rounded-sm"
              title="Buy via WhatsApp Chat"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.806-9.799.002-2.618-1.01-5.078-2.854-6.924C16.379 3.982 13.91 2.97 11.998 2.97c-5.41 0-9.813 4.403-9.815 9.811-.001 1.91.498 3.774 1.447 5.378L2.62 21.38l3.473-1.123.554-.313z"/>
              </svg>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
