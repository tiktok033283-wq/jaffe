import React, { useState } from "react";
import { ShoppingBag, User as UserIcon, MapPin, Search, Menu, X } from "lucide-react";
import Logo from "./Logo";
import { User, CartItem } from "../types";

interface HeaderProps {
  currentUser: User | null;
  cart: CartItem[];
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onNavigate: (view: "shop" | "sell" | "profile" | "tracking") => void;
  currentView: "shop" | "sell" | "profile" | "tracking";
}

export default function Header({
  currentUser,
  cart,
  onOpenCart,
  onOpenAuth,
  onNavigate,
  currentView,
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-100 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              onNavigate("shop");
              setIsMobileMenuOpen(false);
            }}
            id="header-brand-logo"
          >
            <Logo className="w-9 h-9 transition-transform duration-300 group-hover:scale-105" />
            <span className="font-sans text-xl font-semibold tracking-[0.25em] text-black">
              JAFFE
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 lg:space-x-10" id="header-desktop-nav">
            <button
              onClick={() => onNavigate("shop")}
              className={`font-sans text-xs tracking-[0.15em] font-medium transition-colors duration-200 ${
                currentView === "shop" 
                  ? "text-black border-b border-black pb-1" 
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              COLLECTION
            </button>
            <button
              onClick={() => {
                if (currentUser) {
                  onNavigate("sell");
                } else {
                  onOpenAuth();
                }
              }}
              className={`font-sans text-xs tracking-[0.15em] font-medium transition-colors duration-200 ${
                currentView === "sell" 
                  ? "text-black border-b border-black pb-1" 
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              SELL AN ITEM
            </button>
            <button
              onClick={() => {
                if (currentUser) {
                  onNavigate("profile");
                } else {
                  onOpenAuth();
                }
              }}
              className={`font-sans text-xs tracking-[0.15em] font-medium transition-colors duration-200 ${
                currentView === "profile" 
                  ? "text-black border-b border-black pb-1" 
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              ATELIER ACCOUNT
            </button>
            <button
              onClick={() => onNavigate("tracking")}
              className={`font-sans text-xs tracking-[0.15em] font-medium transition-colors duration-200 ${
                currentView === "tracking" 
                  ? "text-black border-b border-black pb-1" 
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              REAL-TIME TRACKING
            </button>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center space-x-5" id="header-actions">
            {/* Search Input Toggle */}
            <div className="relative flex items-center">
              {isSearchOpen && (
                <input
                  type="text"
                  placeholder="Search collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="font-sans text-xs px-3 py-1.5 border border-neutral-200 focus:outline-none focus:border-black w-40 sm:w-52 transition-all duration-300 mr-2 uppercase tracking-wider"
                  autoFocus
                />
              )}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-neutral-600 hover:text-black p-1.5 transition-colors"
                title="Search"
              >
                <Search className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            {/* Profile Button */}
            <button
              onClick={() => {
                if (currentUser) {
                  onNavigate("profile");
                } else {
                  onOpenAuth();
                }
              }}
              className="text-neutral-600 hover:text-black p-0.5 transition-colors relative group"
              title="Profile"
              id="header-profile-btn"
            >
              {currentUser && currentUser.avatarUrl ? (
                <div className="w-6 h-6 rounded-full overflow-hidden border border-neutral-200 shadow-sm group-hover:border-black transition-colors">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <>
                  <UserIcon className="w-5 h-5 stroke-[1.5]" />
                  {currentUser && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-black ring-2 ring-white" />
                  )}
                </>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="text-neutral-600 hover:text-black p-1.5 transition-colors relative"
              title="Cart"
              id="header-cart-btn"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center tracking-normal font-mono scale-95">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-neutral-600 hover:text-black p-1.5"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 stroke-[1.5]" />
              ) : (
                <Menu className="w-5 h-5 stroke-[1.5]" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-4 pt-4 pb-6 space-y-4 shadow-sm animate-fade-in">
          <button
            onClick={() => {
              onNavigate("shop");
              setIsMobileMenuOpen(false);
            }}
            className={`block w-full text-left font-sans text-xs tracking-widest font-medium py-2 ${
              currentView === "shop" ? "text-black font-semibold" : "text-neutral-500"
            }`}
          >
            COLLECTION
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (currentUser) {
                onNavigate("sell");
              } else {
                onOpenAuth();
              }
            }}
            className={`block w-full text-left font-sans text-xs tracking-widest font-medium py-2 ${
              currentView === "sell" ? "text-black font-semibold" : "text-neutral-500"
            }`}
          >
            SELL AN ITEM
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (currentUser) {
                onNavigate("profile");
              } else {
                onOpenAuth();
              }
            }}
            className={`block w-full text-left font-sans text-xs tracking-widest font-medium py-2 ${
              currentView === "profile" ? "text-black font-semibold" : "text-neutral-500"
            }`}
          >
            ATELIER ACCOUNT
          </button>
          <button
            onClick={() => {
              onNavigate("tracking");
              setIsMobileMenuOpen(false);
            }}
            className={`block w-full text-left font-sans text-xs tracking-widest font-medium py-2 ${
              currentView === "tracking" ? "text-black font-semibold" : "text-neutral-500"
            }`}
          >
            REAL-TIME TRACKING
          </button>
          
          {currentUser && (
            <div className="pt-4 border-t border-neutral-100 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase">
                {currentUser.name[0]}
              </div>
              <div>
                <p className="text-xs font-semibold text-black">{currentUser.name}</p>
                <p className="text-[10px] text-neutral-400">{currentUser.email}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
