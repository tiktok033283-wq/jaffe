import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, Phone, MapPin, Loader2 } from "lucide-react";
import { User } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Shipping fields
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("United States");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Google Sign-In Simulation state
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("tiktok033283@gmail.com");
  const [googleName, setGoogleName] = useState("tiktok033283");
  const [isNewGoogleAccount, setIsNewGoogleAccount] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin
      ? { email, password }
      : {
          email,
          password,
          name,
          phone,
          address: street ? { name, street, city, state, postalCode, country } : undefined,
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (emailToUse: string, nameToUse: string) => {
    setGoogleLoading(true);
    setError("");
    try {
      // Create a nice premium visual profile picture based on user name/email
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameToUse)}&backgroundColor=000000,e5e5e5&textColor=ffffff,000000`;
      
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToUse,
          name: nameToUse,
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed");
      }

      onAuthSuccess(data.user, data.token);
      onClose();
      setShowGoogleChooser(false);
    } catch (err: any) {
      setError(err.message);
      setShowGoogleChooser(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="auth-modal-container">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Stage */}
      <div className="relative bg-white border border-neutral-100 max-w-md w-full p-8 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-black transition-colors"
        >
          <X className="w-5 h-5 stroke-[1.5]" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <span className="font-sans text-xs font-semibold tracking-[0.3em] text-neutral-400 uppercase">
            Jaffe Atelier
          </span>
          <h4 className="font-sans text-lg font-medium tracking-widest text-black uppercase mt-1">
            {isLogin ? "MEMBER SIGN IN" : "CREATE ATELIER REGISTER"}
          </h4>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-[11px] p-4 mb-6 font-sans tracking-wide">
            {error}
          </div>
        )}

        {/* Google sign-up / login option */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowGoogleChooser(true)}
            className="w-full bg-white text-neutral-700 text-xs font-semibold tracking-widest uppercase py-3.5 border border-neutral-200 hover:bg-neutral-50 transition-all duration-300 flex items-center justify-center space-x-2.5 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.764 1.058 15.013 0 12 0 7.33 0 3.315 2.68 1.34 6.59l3.926 3.175z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.825-.075-1.613-.213-2.375H12v4.562h6.488a5.64 5.64 0 0 1-2.438 3.7l3.8 2.946c2.225-2.05 3.64-5.071 3.64-8.833z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235L1.34 17.41C3.315 21.32 7.33 24 12 24c3.09 0 5.69-.1 7.64-2.827l-3.8-2.945a7.1 7.1 0 0 1-3.84 1.09c-3.8 0-7.01-2.48-8.154-5.88l-3.926 3.175A11.93 11.93 0 0 0 5.266 14.235z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.273 0 6.014-1.087 8.018-2.945l-3.8-2.946c-1.12.75-2.545 1.2-4.218 1.2a7.1 7.1 0 0 1-7.234-4.885l-3.926 3.175A11.96 11.96 0 0 0 12 24z"
              />
            </svg>
            <span>CONTINUE WITH GOOGLE</span>
          </button>

          {/* Luxury Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-neutral-100"></div>
            <span className="flex-shrink mx-4 text-[9px] text-neutral-400 font-sans tracking-widest font-semibold uppercase">
              OR LOGIN WITH EMAIL
            </span>
            <div className="flex-grow border-t border-neutral-100"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Create register exclusive fields */}
          {!isLogin && (
            <div className="space-y-4 animate-fade-in">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 pointer-events-none">
                  <UserIcon className="w-4 h-4 stroke-[1.5]" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans tracking-wider text-black focus:outline-none focus:border-black uppercase transition-colors"
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 pointer-events-none">
                  <Phone className="w-4 h-4 stroke-[1.5]" />
                </span>
                <input
                  type="tel"
                  placeholder="Mobile (Optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans tracking-wider text-black focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>
          )}

          {/* Common Fields */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 pointer-events-none">
              <Mail className="w-4 h-4 stroke-[1.5]" />
            </span>
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans tracking-wider text-black focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 pointer-events-none">
              <Lock className="w-4 h-4 stroke-[1.5]" />
            </span>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans tracking-wider text-black focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Registration Optional Shipping Fields */}
          {!isLogin && (
            <div className="pt-4 border-t border-neutral-100 space-y-3 animate-fade-in">
              <span className="block text-[10px] text-neutral-400 tracking-widest font-mono uppercase">
                SHIPPING DETAILS (OPTIONAL)
              </span>
              
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 pointer-events-none">
                  <MapPin className="w-4 h-4 stroke-[1.5]" />
                </span>
                <input
                  type="text"
                  placeholder="Street Address"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans tracking-wider text-black focus:outline-none focus:border-black uppercase transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans tracking-wider text-black focus:outline-none focus:border-black uppercase transition-colors"
                />
                <input
                  type="text"
                  placeholder="State/Province"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans tracking-wider text-black focus:outline-none focus:border-black uppercase transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans tracking-wider text-black focus:outline-none focus:border-black uppercase transition-colors"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans tracking-wider text-black focus:outline-none focus:border-black uppercase transition-colors"
                />
              </div>
            </div>
          )}

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white text-xs font-semibold tracking-widest uppercase py-4 border border-black hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{isLogin ? "SIGN IN" : "REGISTER ATELIER ACCOUNT"}</span>
            )}
          </button>
        </form>

        {/* Switching Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="font-sans text-[10px] tracking-widest text-neutral-400 hover:text-black uppercase transition-colors pb-1 border-b border-transparent hover:border-black"
          >
            {isLogin
              ? "Create a new Jaffe Atelier registry"
              : "Already registered? Login to your account"}
          </button>
        </div>

      </div>

      {/* Google Account Selector Pop-up Simulation */}
      {showGoogleChooser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-white max-w-sm w-full p-6 shadow-2xl animate-fade-in border border-neutral-100 rounded-lg font-sans">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.275c0-.825-.075-1.613-.213-2.375H12v4.562h6.488a5.64 5.64 0 0 1-2.438 3.7l3.8 2.946c2.225-2.05 3.64-5.071 3.64-8.833z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.273 0 6.014-1.087 8.018-2.945l-3.8-2.946c-1.12.75-2.545 1.2-4.218 1.2a7.1 7.1 0 0 1-7.234-4.885l-3.926 3.175A11.96 11.96 0 0 0 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.266 14.235L1.34 17.41C3.315 21.32 7.33 24 12 24c3.09 0 5.69-.1 7.64-2.827l-3.8-2.945a7.1 7.1 0 0 1-3.84 1.09c-3.8 0-7.01-2.48-8.154-5.88l-3.926 3.175A11.93 11.93 0 0 0 5.266 14.235z"
                  />
                  <path
                    fill="#EA4335"
                    d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.764 1.058 15.013 0 12 0 7.33 0 3.315 2.68 1.34 6.59l3.926 3.175z"
                  />
                </svg>
                <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Google Accounts</span>
              </div>
              <button onClick={() => setShowGoogleChooser(false)} className="text-neutral-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 text-center">
              <h5 className="text-sm font-semibold text-neutral-800">Choose an account</h5>
              <p className="text-[11px] text-neutral-400 mt-0.5">to continue to <strong className="text-black font-semibold">Jaffe Atelier</strong></p>
            </div>

            {googleLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 className="w-8 h-8 text-black animate-spin" />
                <span className="text-[10px] tracking-widest text-neutral-400 uppercase">Synchronizing registry...</span>
              </div>
            ) : !isNewGoogleAccount ? (
              <div className="space-y-2">
                {/* User's standard email choice */}
                <button
                  onClick={() => handleGoogleAuth("tiktok033283@gmail.com", "tiktok033283")}
                  className="w-full flex items-center p-3 hover:bg-neutral-50 border border-neutral-100 rounded-lg text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center uppercase mr-3">
                    T
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-black">tiktok033283</div>
                    <div className="text-[10px] text-neutral-400 font-mono">tiktok033283@gmail.com</div>
                  </div>
                </button>

                {/* Option to use another account */}
                <button
                  onClick={() => setIsNewGoogleAccount(true)}
                  className="w-full flex items-center p-3 hover:bg-neutral-50 border border-dashed border-neutral-200 rounded-lg text-left transition-colors text-neutral-600 hover:text-black"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 text-xs font-bold flex items-center justify-center mr-3">
                    +
                  </div>
                  <span className="text-xs font-semibold tracking-wide uppercase">Use another account</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (googleEmail && googleName) {
                    handleGoogleAuth(googleEmail, googleName);
                  }
                }}
                className="space-y-3 animate-fade-in"
              >
                <div>
                  <label className="block text-[9px] text-neutral-400 font-bold uppercase tracking-wider mb-1">GOOGLE EMAIL ADDRESS</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 text-xs rounded focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-neutral-400 font-bold uppercase tracking-wider mb-1">GOOGLE DISPLAY NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jean Jaffe"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 text-xs rounded focus:outline-none focus:border-black"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-black text-white hover:bg-neutral-800 text-[10px] font-bold tracking-widest uppercase py-2.5 rounded transition-colors"
                  >
                    SIGN IN WITH GOOGLE
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewGoogleAccount(false)}
                    className="px-3 border border-neutral-200 hover:border-black text-[10px] text-neutral-500 hover:text-black tracking-widest uppercase rounded"
                  >
                    BACK
                  </button>
                </div>
              </form>
            )}

            <p className="text-[9px] text-neutral-400 text-center leading-relaxed mt-6">
              To continue, Google will share your name, email address, language preference, and profile picture with Jaffe Atelier. See our Privacy Policy and Terms.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
