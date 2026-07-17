import React from "react";
import { X, Minus, Plus, Trash2, Lock } from "lucide-react";
import { CartItem } from "../types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number, size?: string, color?: string) => void;
  onRemoveItem: (productId: string, size?: string, color?: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 25; // Complimentary over $500
  const tax = subtotal * 0.08; // 8% sales tax
  const total = subtotal + shipping + tax;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-container">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Stage */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-neutral-100">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-sans text-sm font-semibold tracking-[0.2em] text-black">
                YOUR ATELIER BAG
              </span>
              <span className="font-mono text-[10px] text-neutral-400">
                ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-neutral-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-400">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-semibold tracking-[0.15em] text-black uppercase mb-1">
                    Your Bag is Empty
                  </h4>
                  <p className="font-sans text-[11px] text-neutral-400 max-w-[240px] leading-relaxed">
                    Explore Jaffe collections to secure our latest handmade limited editions.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="font-sans text-[10px] font-semibold tracking-widest text-black border-b border-black pb-1 uppercase hover:opacity-70 transition-opacity"
                >
                  Return to Collection
                </button>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${index}`} className="py-5 flex space-x-4">
                  
                  {/* Thumbnail */}
                  <div className="w-20 h-24 bg-neutral-50 flex-shrink-0 overflow-hidden border border-neutral-100">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter grayscale-[10%]"
                    />
                  </div>

                  {/* Detail Info */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-sans text-xs font-medium text-neutral-900 line-clamp-1">
                          {item.product.name}
                        </h5>
                        <p className="font-mono text-[9px] text-neutral-400 uppercase mt-0.5 tracking-wider">
                          {item.selectedSize && `Size: ${item.selectedSize}`} 
                          {item.selectedSize && item.selectedColor && " | "}
                          {item.selectedColor && `Color: ${item.selectedColor}`}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-black">
                        Rs. {(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    {/* Quantity Selector & Remove Hook */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center border border-neutral-200 bg-neutral-50">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1, item.selectedSize, item.selectedColor)}
                          className="px-2 py-1 text-neutral-500 hover:text-black transition-colors"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3 stroke-[2]" />
                        </button>
                        <span className="px-2.5 font-mono text-xs text-black font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1, item.selectedSize, item.selectedColor)}
                          className="px-2 py-1 text-neutral-500 hover:text-black transition-colors"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3 stroke-[2]" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id, item.selectedSize, item.selectedColor)}
                        className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Order Calculations */}
          {cart.length > 0 && (
            <div className="border-t border-neutral-100 p-6 bg-neutral-50 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-sans text-neutral-500">
                  <span>ATELIER SUB-TOTAL</span>
                  <span className="font-mono">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] font-sans text-neutral-500">
                  <span>EXPRESS SHIPPING</span>
                  <span className="font-mono">
                    {shipping === 0 ? "COMPLIMENTARY" : `Rs. ${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-sans text-neutral-500">
                  <span>SALES TAX (8%)</span>
                  <span className="font-mono">Rs. {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-sans font-semibold text-black pt-2 border-t border-neutral-200">
                  <span>ESTIMATED TOTAL</span>
                  <span className="font-mono">Rs. {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Secure Checkout C.T.A. */}
              <button
                onClick={onCheckout}
                className="w-full bg-black text-white text-xs font-semibold tracking-widest uppercase py-4 border border-black hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>SECURE CHECKOUT</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
