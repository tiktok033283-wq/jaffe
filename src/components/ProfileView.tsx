import React, { useState } from "react";
import { User as UserIcon, Calendar, Phone, MapPin, ShoppingBag, Edit, Check, LogOut, ArrowRight, Save, Camera, Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { User, Order, Address } from "../types";

interface ProfileViewProps {
  currentUser: User;
  orders: Order[];
  onUpdateProfile: (name: string, phone: string, address: Address, avatarUrl?: string) => Promise<void>;
  onTrackOrder: (order: Order) => void;
  onLogout: () => void;
  loading: boolean;
}

export default function ProfileView({
  currentUser,
  orders,
  onUpdateProfile,
  onTrackOrder,
  onLogout,
  loading,
}: ProfileViewProps) {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || "");

  // Avatar Modal State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = useState(currentUser.avatarUrl || "");
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Address fields
  const [street, setStreet] = useState(currentUser.shippingAddress?.street || "");
  const [city, setCity] = useState(currentUser.shippingAddress?.city || "");
  const [state, setState] = useState(currentUser.shippingAddress?.state || "");
  const [postalCode, setPostalCode] = useState(currentUser.shippingAddress?.postalCode || "");
  const [country, setCountry] = useState(currentUser.shippingAddress?.country || "United States");

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const address: Address = {
      name,
      street,
      city,
      state,
      postalCode,
      country,
    };
    await onUpdateProfile(name, phone, address);
    setIsEditingAddress(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12" id="profile-atelier-view">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-100 pb-8 mb-10 gap-4">
        <div className="flex items-center space-x-4">
          <div
            onClick={() => {
              setTempAvatarUrl(currentUser.avatarUrl || "");
              setShowAvatarModal(true);
            }}
            className="relative group cursor-pointer w-16 h-16 rounded-full overflow-hidden border border-neutral-200 shadow-sm hover:border-black transition-colors"
            title="Update Profile Picture"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-black text-white flex items-center justify-center font-bold text-xl uppercase tracking-wider">
                {currentUser.name[0]}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[8px] font-bold tracking-widest uppercase">
              <Camera className="w-4 h-4 mb-0.5" />
              <span>EDIT</span>
            </div>
          </div>
          <div>
            <span className="font-sans text-[10px] text-neutral-400 tracking-[0.25em] uppercase block">
              Jaffe Atelier Member
            </span>
            <h2 className="font-sans text-xl font-medium tracking-wider text-black uppercase">
              {currentUser.name}
            </h2>
            <div className="flex items-center space-x-3 text-neutral-500 text-[11px] mt-1">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                Joined {currentUser.joinedDate}
              </span>
              <span>•</span>
              <span className="font-mono text-neutral-400">{currentUser.email}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="self-start md:self-center flex items-center space-x-1.5 px-4 py-2 border border-neutral-200 text-neutral-500 hover:text-black hover:border-black text-[10px] font-semibold tracking-widest uppercase transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>LOGOUT</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Profile / Shipping Details panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-neutral-100 p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-sans text-xs font-semibold tracking-[0.2em] text-black uppercase">
                ATELIER REGISTRY
              </h3>
              {!isEditingAddress && (
                <button
                  onClick={() => setIsEditingAddress(true)}
                  className="text-[10px] font-semibold text-neutral-400 hover:text-black tracking-widest flex items-center uppercase"
                >
                  <Edit className="w-3 h-3 mr-1" /> EDIT
                </button>
              )}
            </div>

            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-[10px] p-2 flex items-center">
                <Check className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
                <span>PROFILE UPDATED SUCCESSFULLY</span>
              </div>
            )}

            {isEditingAddress ? (
              <form onSubmit={handleSave} className="space-y-4 animate-fade-in">
                
                <div>
                  <label className="block text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-neutral-400 tracking-wider uppercase mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-3 pt-3 border-t border-neutral-100">
                  <span className="block text-[9px] text-neutral-400 tracking-widest uppercase">Shipping Destination</span>
                  
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Street Address"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase"
                    />
                    <input
                      type="text"
                      required
                      placeholder="State/Province"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Postal Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-grow bg-black text-white hover:bg-neutral-800 text-[10px] font-semibold tracking-widest uppercase py-2.5 transition-colors flex items-center justify-center"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" /> SAVE CHANGES
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(false)}
                    className="px-3 border border-neutral-200 hover:border-black text-[10px] text-neutral-500 hover:text-black tracking-widest uppercase"
                  >
                    CANCEL
                  </button>
                </div>

              </form>
            ) : (
              <div className="space-y-4 text-xs font-sans text-neutral-700">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-neutral-400 stroke-[1.5]" />
                  <span>{currentUser.phone || "No phone added"}</span>
                </div>

                <div className="flex items-start space-x-2 pt-3 border-t border-neutral-100">
                  <MapPin className="w-4 h-4 text-neutral-400 stroke-[1.5] mt-0.5" />
                  {currentUser.shippingAddress ? (
                    <div className="space-y-1">
                      <span className="block font-medium text-black">COMPLIMENTARY ADDRESS</span>
                      <p className="uppercase leading-relaxed text-neutral-500 text-[11px]">
                        {currentUser.shippingAddress.street}<br />
                        {currentUser.shippingAddress.city}, {currentUser.shippingAddress.state} {currentUser.shippingAddress.postalCode}<br />
                        {currentUser.shippingAddress.country}
                      </p>
                    </div>
                  ) : (
                    <span className="text-neutral-400 italic">No shipping destination registered.</span>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Orders Archive list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-neutral-100 p-6">
            <h3 className="font-sans text-xs font-semibold tracking-[0.2em] text-black uppercase border-b border-neutral-100 pb-3 mb-6 flex items-center">
              <ShoppingBag className="w-4 h-4 mr-1.5 text-black" />
              ORDER HISTORY ARCHIVE ({orders.length})
            </h3>

            {orders.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center mx-auto text-neutral-300">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-semibold tracking-widest text-black uppercase">No orders registered</h4>
                  <p className="font-sans text-[10px] text-neutral-400 max-w-xs mx-auto leading-relaxed mt-1">
                    Your Jaffe ledger is currently clear. Once you acquire a product, your shipping codes will appear here instantly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <div key={order.id} className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-neutral-50/50 px-2 transition-colors">
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-black">{order.id}</span>
                        <span className={`text-[9px] font-semibold font-mono tracking-wider px-2 py-0.5 uppercase ${
                          order.status === "delivered" 
                            ? "bg-neutral-100 text-neutral-800" 
                            : "bg-black text-white"
                        }`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-[10px] text-neutral-400 font-sans mt-1">
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{order.items.reduce((sum, i) => sum + i.quantity, 0)} items</span>
                        <span>•</span>
                        <span className="font-mono font-medium text-neutral-500">${order.total.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onTrackOrder(order)}
                      className="text-[10px] font-semibold text-black tracking-widest uppercase hover:opacity-75 transition-opacity flex items-center group"
                    >
                      TRACK REAL-TIME <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </button>

                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Profile Picture (Avatar) Selection & Upload Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" id="avatar-update-modal">
          <div className="absolute inset-0" onClick={() => setShowAvatarModal(false)} />
          
          <div className="relative bg-white border border-neutral-100 max-w-md w-full p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <span className="font-sans text-[10px] font-semibold tracking-[0.25em] text-neutral-400 uppercase">
                Jaffe Registry
              </span>
              <h4 className="font-sans text-sm font-medium tracking-widest text-black uppercase mt-1">
                UPDATE PROFILE PICTURE
              </h4>
            </div>

            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border border-neutral-200 bg-neutral-50 shadow-inner flex items-center justify-center">
                {tempAvatarUrl ? (
                  <img
                    src={tempAvatarUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black text-white font-bold text-3xl uppercase">
                    {currentUser.name[0]}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Option 1: Base64 File Upload */}
              <div className="space-y-2">
                <label className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                  OPTION 1: UPLOAD CUSTOM FILE
                </label>
                <div className="relative border-2 border-dashed border-neutral-200 hover:border-black p-4 text-center cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setTempAvatarUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Upload className="w-5 h-5 text-neutral-400 group-hover:text-black transition-colors" />
                    <span className="text-[11px] text-neutral-500 font-medium group-hover:text-black">
                      Select photo from computer/phone
                    </span>
                    <span className="text-[9px] text-neutral-400 uppercase tracking-widest">
                      Supports JPG, PNG, WEBP
                    </span>
                  </div>
                </div>
              </div>

              {/* Option 2: Pre-selected Designer Avatars */}
              <div className="space-y-2">
                <label className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                  OPTION 2: CHOOSE DESIGNER INITIALS PRESET
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}&backgroundColor=0d0d0d&textColor=ffffff`,
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}&backgroundColor=737373&textColor=ffffff`,
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}&backgroundColor=e5e5e5&textColor=000000`,
                    `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(currentUser.name)}&backgroundColor=000000`,
                  ].map((presetUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTempAvatarUrl(presetUrl)}
                      className={`relative w-full aspect-square rounded-full overflow-hidden border-2 transition-all ${
                        tempAvatarUrl === presetUrl ? "border-black scale-95 shadow-md" : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <img src={presetUrl} alt="Preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 3: External Image URL */}
              <div className="space-y-2">
                <label className="block text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
                  OPTION 3: PASTE PHOTO LINK
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400">
                    <ImageIcon className="w-4 h-4 stroke-[1.5]" />
                  </span>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={tempAvatarUrl.startsWith("data:") ? "" : tempAvatarUrl}
                    onChange={(e) => setTempAvatarUrl(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-6 border-t border-neutral-100 mt-8">
              <button
                onClick={async () => {
                  setAvatarLoading(true);
                  try {
                    const address = currentUser.shippingAddress || {
                      name: currentUser.name,
                      street: "",
                      city: "",
                      state: "",
                      postalCode: "",
                      country: "United States",
                    };
                    await onUpdateProfile(currentUser.name, currentUser.phone || "", address, tempAvatarUrl);
                    setShowAvatarModal(false);
                  } catch (err) {
                    console.error("Failed to update profile picture:", err);
                  } finally {
                    setAvatarLoading(false);
                  }
                }}
                disabled={avatarLoading}
                className="flex-1 bg-black text-white hover:bg-neutral-800 text-[10px] font-semibold tracking-widest uppercase py-3.5 transition-colors flex items-center justify-center space-x-2"
              >
                {avatarLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>SAVE PICTURE</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="px-4 border border-neutral-200 hover:border-black text-[10px] text-neutral-500 hover:text-black tracking-widest uppercase transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
