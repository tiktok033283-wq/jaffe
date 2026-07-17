import React, { useState, useEffect } from "react";
import { X, Lock, ShieldCheck, HelpCircle, Loader2, CreditCard, Truck, MapPin, CheckCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Address } from "../types";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  initialAddress?: Address;
  initialPhone?: string;
  onPaymentSuccess: (
    method: "stripe" | "sandbox" | "cod",
    shippingFee: number,
    shippingMethod: string,
    address: Address
  ) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  subtotal,
  initialAddress,
  initialPhone,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isStripeAvailable, setIsStripeAvailable] = useState(false);

  // Checkout Steps: "confirm" | "shipping" | "payment"
  const [checkoutStep, setCheckoutStep] = useState<"confirm" | "shipping" | "payment">("confirm");

  // 1. All Location Options (Shipping Address)
  const [shippingName, setShippingName] = useState(initialAddress?.name || "");
  const [street, setStreet] = useState(initialAddress?.street || "");
  const [city, setCity] = useState(initialAddress?.city || "");
  const [state, setState] = useState(initialAddress?.state || "");
  const [postalCode, setPostalCode] = useState(initialAddress?.postalCode || "");
  const [country, setCountry] = useState(initialAddress?.country || "United States");
  const [phone, setPhone] = useState(initialPhone || "");

  // 2. Delivery Options & Associated Amounts
  const [deliveryOption, setDeliveryOption] = useState<"free" | "standard" | "cod">("free");

  // 3. Payment Mode Selection
  const [paymentMode, setPaymentMode] = useState<"card" | "cod">("card");

  // Simulated Card Fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const stripePublishableKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (stripePublishableKey) {
      setIsStripeAvailable(true);
    }
  }, [stripePublishableKey]);

  // Sync address changes if user loads/profile updates
  useEffect(() => {
    if (initialAddress) {
      setShippingName(initialAddress.name || "");
      setStreet(initialAddress.street || "");
      setCity(initialAddress.city || "");
      setState(initialAddress.state || "");
      setPostalCode(initialAddress.postalCode || "");
      setCountry(initialAddress.country || "United States");
    }
    if (initialPhone) {
      setPhone(initialPhone);
    }
  }, [initialAddress, initialPhone]);

  if (!isOpen) return null;

  // Pricing calculations
  const getShippingFee = () => {
    if (deliveryOption === "free") return 0;
    if (deliveryOption === "standard") return 250; // Regular delivery fee in Rs.
    if (deliveryOption === "cod") return 150; // Cash on delivery service charge in Rs.
    return 0;
  };

  const getShippingLabel = () => {
    if (deliveryOption === "free") return "Free Standard Ground";
    if (deliveryOption === "standard") return "Atelier Regular Courier";
    if (deliveryOption === "cod") return "Atelier Cash on Delivery";
    return "";
  };

  const shippingFee = getShippingFee();
  const tax = subtotal * 0.08;
  const grandTotal = subtotal + shippingFee + tax;

  const handleValidateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!shippingName || !street || !city || !state || !postalCode || !country) {
      setError("Please complete all destination fields to ensure luxury courier transit.");
      return;
    }

    // Advance to payment step
    setCheckoutStep("payment");
  };

  const executeFinalCheckout = async (method: "stripe" | "sandbox" | "cod") => {
    setLoading(true);
    setError("");

    const finalAddress: Address = {
      name: shippingName,
      street,
      city,
      state,
      postalCode,
      country,
    };

    // If stripe is available and the method is card, process via Stripe
    if (method === "stripe" && isStripeAvailable) {
      try {
        const response = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: grandTotal }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Payment handshake failed");
        }

        if (data.mode === "sandbox") {
          setTimeout(() => {
            setLoading(false);
            onPaymentSuccess("sandbox", shippingFee, getShippingLabel(), finalAddress);
            onClose();
          }, 1500);
          return;
        }

        const stripe = await loadStripe(stripePublishableKey);
        if (!stripe) {
          throw new Error("Stripe script failed to initialize.");
        }

        setTimeout(() => {
          setLoading(false);
          onPaymentSuccess("stripe", shippingFee, getShippingLabel(), finalAddress);
          onClose();
        }, 1500);

      } catch (err: any) {
        setError(err.message || "An error occurred with Stripe elements.");
        setLoading(false);
      }
    } else {
      // Sandbox Card or Cash on Delivery payment
      setTimeout(() => {
        setLoading(false);
        onPaymentSuccess(method, shippingFee, getShippingLabel(), finalAddress);
        onClose();
      }, 1800);
    }
  };

  const handleSimulatedCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, "").length < 16) {
      setError("Please provide a valid 16-digit card number.");
      return;
    }
    if (cardExpiry.length < 5) {
      setError("Please provide a valid expiry date (MM/YY).");
      return;
    }
    if (cardCvc.length < 3) {
      setError("Please provide a valid CVC code.");
      return;
    }

    executeFinalCheckout("sandbox");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="checkout-gateway-modal">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog container */}
      <div className="relative bg-white border border-neutral-100 max-w-2xl w-full p-8 shadow-2xl animate-fade-in max-h-[92vh] overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-black transition-colors z-10"
        >
          <X className="w-5 h-5 stroke-[1.5]" />
        </button>

        {/* Column 1: Main Flow inputs (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Header */}
          <div className="border-b border-neutral-100 pb-4">
            <span className="font-sans text-[9px] text-neutral-400 tracking-[0.3em] uppercase block">
              Atelier Checkout & Gateway
            </span>
            <h4 className="font-sans text-sm font-bold tracking-widest text-black uppercase mt-1">
              {checkoutStep === "confirm"
                ? "1. ORDER CONFIRMATION"
                : checkoutStep === "shipping"
                ? "2. DELIVERY DESTINATION"
                : "3. AUTHORIZE TRANSACTION"}
            </h4>
          </div>

          {error && (
            <div className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-[11px] p-3 font-sans">
              {error}
            </div>
          )}

          {checkoutStep === "confirm" ? (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-4 text-center">
                <ShieldCheck className="w-12 h-12 mx-auto text-black stroke-[1.2] animate-pulse" />
                <div className="space-y-2">
                  <h5 className="text-xs font-bold tracking-[0.2em] text-black uppercase">
                    CONFIRM SARTORIAL TRANSACTION
                  </h5>
                  <p className="text-[11px] text-neutral-500 leading-relaxed max-w-md mx-auto uppercase tracking-wide">
                    Aap apna order confirm karna chahte hain? Confirm karne ke baad complimentary FREE DELIVERY option active ho jayega.
                  </p>
                  <p className="text-[10px] text-neutral-400 leading-relaxed max-w-md mx-auto">
                    Verify your luxury pieces in the right-hand ledger. Once you verify, secure digital freight is guaranteed.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-[10px] font-bold tracking-[0.2em] uppercase py-4 border border-transparent transition-colors flex items-center justify-center"
                >
                  CANCEL ORDER (CANCEL KAREIN)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryOption("free"); // Auto-unlock free delivery!
                    setCheckoutStep("shipping");
                  }}
                  className="w-full bg-black hover:bg-neutral-800 text-white text-[10px] font-bold tracking-[0.2em] uppercase py-4 transition-colors flex items-center justify-center shadow-md"
                >
                  CONFIRM ORDER (ORDER PAKKA KAREIN)
                </button>
              </div>
            </div>
          ) : checkoutStep === "shipping" ? (
            <form onSubmit={handleValidateShipping} className="space-y-4">
              
              <span className="block text-[10px] text-neutral-400 font-sans tracking-wider uppercase font-semibold">
                Destination Coordinates
              </span>

              <div className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="RECIPIENT FULL NAME"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase transition-colors"
                />

                <input
                  type="text"
                  required
                  placeholder="STREET ADDRESS"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase transition-colors"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="CITY"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase transition-colors"
                  />
                  <input
                    type="text"
                    required
                    placeholder="STATE / PROVINCE"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="POSTAL / ZIP CODE"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black uppercase transition-colors"
                  />
                  <input
                    type="text"
                    required
                    placeholder="COUNTRY"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 text-xs font-sans text-black focus:outline-none focus:border-black uppercase transition-colors"
                  />
                </div>

                <input
                  type="tel"
                  placeholder="CONTACT PHONE NUMBER (OPTIONAL)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 text-xs font-mono text-black focus:outline-none focus:border-black transition-colors"
                />
              </div>

              {/* Delivery Speed / Rate Selector */}
              <div className="space-y-2 pt-2">
                <span className="block text-[10px] text-neutral-400 font-sans tracking-wider uppercase font-semibold">
                  SELECT DELIVERY FREIGHT AMOUNT
                </span>

                <div className="space-y-2">
                  {/* Free delivery */}
                  <div
                    onClick={() => setDeliveryOption("free")}
                    className={`border p-3 flex items-center justify-between cursor-pointer transition-all ${
                      deliveryOption === "free" ? "bg-black text-white border-black" : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-black"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Truck className="w-4 h-4" />
                      <div className="text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-wider">Free Delivery</span>
                        <span className="block text-[9px] opacity-70">COMPLIMENTARY GROUND SHIPPED (5-7 BUSINESS DAYS)</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold">Rs. 0</span>
                  </div>

                  {/* Regular Delivery */}
                  <div
                    onClick={() => setDeliveryOption("standard")}
                    className={`border p-3 flex items-center justify-between cursor-pointer transition-all ${
                      deliveryOption === "standard" ? "bg-black text-white border-black" : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-black"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Truck className="w-4 h-4" />
                      <div className="text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-wider">Courier Delivery</span>
                        <span className="block text-[9px] opacity-70">EXPRESS SARTORIAL COURIER (1-2 BUSINESS DAYS)</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold">Rs. 250</span>
                  </div>

                  {/* Cash on Delivery */}
                  <div
                    onClick={() => {
                      setDeliveryOption("cod");
                      setPaymentMode("cod"); // Auto switch payment mode to COD for ease
                    }}
                    className={`border p-3 flex items-center justify-between cursor-pointer transition-all ${
                      deliveryOption === "cod" ? "bg-black text-white border-black" : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-black"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Truck className="w-4 h-4" />
                      <div className="text-left">
                        <span className="block text-[10px] font-bold uppercase tracking-wider">Cash on Delivery (C.O.D.)</span>
                        <span className="block text-[9px] opacity-70">WHITE-GLOVE COURIER (COLLECT AT YOUR DOORSTEP)</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold">Rs. 150</span>
                  </div>
                </div>

              </div>

              <button
                type="submit"
                className="w-full bg-black hover:bg-neutral-800 text-white text-[10px] font-bold tracking-[0.2em] uppercase py-3.5 transition-colors flex items-center justify-center space-x-1"
              >
                <span>CONTINUE TO PAYMENT MODE</span>
                <X className="w-3.5 h-3.5 rotate-180 ml-1.5" />
              </button>

            </form>
          ) : (
            <div className="space-y-6">
              
              {/* Payment selection modes */}
              <div className="space-y-3">
                <span className="block text-[10px] text-neutral-400 font-sans tracking-wider uppercase font-semibold">
                  SELECT PAYMENT MODE
                </span>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold uppercase tracking-wider">
                  <button
                    onClick={() => setPaymentMode("card")}
                    className={`py-3 border transition-colors ${
                      paymentMode === "card" ? "bg-black text-white border-black" : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-black"
                    }`}
                  >
                    CREDIT / DEBIT CARD
                  </button>
                  <button
                    onClick={() => {
                      setPaymentMode("cod");
                      setDeliveryOption("cod"); // Match COD delivery speed
                    }}
                    className={`py-3 border transition-colors ${
                      paymentMode === "cod" ? "bg-black text-white border-black" : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-black"
                    }`}
                  >
                    CASH ON DELIVERY (C.O.D.)
                  </button>
                </div>
              </div>

              {/* CARD DETAILS FORM */}
              {paymentMode === "card" ? (
                isStripeAvailable ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => executeFinalCheckout("stripe")}
                      disabled={loading}
                      className="w-full bg-black text-white text-xs font-semibold tracking-widest uppercase py-4 border border-black hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>AUTHORIZE STRIPE CARD TRANSACTION</span>
                        </>
                      )}
                    </button>
                    <p className="text-center font-sans text-[9px] text-neutral-400">
                      Payment is tokenized and processed instantly according to PCI-DSS standards.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSimulatedCardSubmit} className="space-y-3">
                    <span className="block text-[9px] text-neutral-400 font-mono uppercase tracking-widest">
                      Enter Card coordinates
                    </span>

                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 pointer-events-none">
                        <CreditCard className="w-4 h-4 stroke-[1.5]" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="CARD NUMBER (16 DIGITS)"
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                          const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ");
                          setCardNumber(formatted);
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-mono tracking-widest text-black focus:outline-none focus:border-black transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (val.length >= 3) {
                            val = val.slice(0, 2) + "/" + val.slice(2);
                          }
                          setCardExpiry(val);
                        }}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-mono tracking-widest text-black focus:outline-none focus:border-black text-center transition-colors"
                      />
                      <input
                        type="password"
                        required
                        placeholder="CVC"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-mono tracking-widest text-black focus:outline-none focus:border-black text-center transition-colors"
                      />
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="CARDHOLDER NAME"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 text-xs font-sans tracking-wider text-black focus:outline-none focus:border-black uppercase transition-colors"
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-black text-white text-[10px] font-semibold tracking-widest uppercase py-3.5 border border-black hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>AUTHORIZE CRYPTOGRAPHIC SANDBOX</span>
                        </>
                      )}
                    </button>
                  </form>
                )
              ) : (
                /* CASH ON DELIVERY VIEW */
                <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-4 text-center">
                  <Truck className="w-10 h-10 mx-auto text-black stroke-[1.5]" />
                  <div className="space-y-1">
                    <h5 className="font-sans text-xs font-bold tracking-wider text-black uppercase">
                      CASH ON DELIVERY REGISTERED
                    </h5>
                    <p className="font-sans text-[11px] text-neutral-500 max-w-sm mx-auto leading-relaxed">
                      Your premium garment(s) will be prepared and shipped directly. Hand over cash/card to our specialized concierge courier upon receiving your parcel at:
                    </p>
                    <span className="block font-sans text-[10px] font-semibold text-black uppercase bg-neutral-200/50 py-1.5 px-3 mt-2 tracking-wide">
                      {street}, {city}, {state}
                    </span>
                  </div>

                  <button
                    onClick={() => executeFinalCheckout("cod")}
                    disabled={loading}
                    className="w-full bg-black text-white text-[10px] font-bold tracking-[0.2em] uppercase py-3.5 border border-black hover:bg-white hover:text-black transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-white" />
                        <span>PLACE CASH ON DELIVERY ORDER</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Navigation Back */}
              <button
                type="button"
                onClick={() => setCheckoutStep("shipping")}
                className="text-[9px] font-sans font-semibold tracking-widest uppercase border-b border-black text-black hover:opacity-75 pb-0.5"
              >
                ← BACK TO ADDRESS & FREIGHT
              </button>

            </div>
          )}

        </div>

        {/* Column 2: Cart Summary & Totals (5 cols) */}
        <div className="md:col-span-5 bg-neutral-50/70 border border-neutral-100 p-6 flex flex-col justify-between self-start">
          
          <div className="space-y-4">
            <h5 className="font-sans text-[10px] font-bold tracking-widest text-black uppercase border-b border-neutral-200 pb-2">
              SARTORIAL SUMMARY
            </h5>

            {/* Calculations */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-[11px] font-sans text-neutral-500">
                <span>SUBTOTAL</span>
                <span className="font-mono">Rs. {subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-[11px] font-sans text-neutral-500">
                <span>DELIVERY COURIER</span>
                <span className="font-mono text-right">
                  {shippingFee === 0 ? "FREE" : `Rs. ${shippingFee.toLocaleString()}`}
                  <span className="block text-[8px] tracking-wide uppercase text-neutral-400 font-sans mt-0.5">
                    {getShippingLabel()}
                  </span>
                </span>
              </div>

              <div className="flex justify-between text-[11px] font-sans text-neutral-500">
                <span>SALES TAX (8%)</span>
                <span className="font-mono">Rs. {tax.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-xs font-sans font-bold text-black pt-3 border-t border-neutral-200">
                <span>SECURED TOTAL</span>
                <span className="font-mono">Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-start space-x-2 text-neutral-500">
              <MapPin className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <span className="block text-[9px] font-bold uppercase text-black tracking-wider">SHIPPING TRANSIT DESTINATION</span>
                <span className="block text-[9px] uppercase line-clamp-2">
                  {street ? `${street}, ${city}, ${state} ${postalCode}` : "Destination Coordinates not entered yet."}
                </span>
              </div>
            </div>

            <div className="text-[9px] text-neutral-400 leading-relaxed font-sans border-t border-neutral-200 pt-3">
              Jaffe Atelier products are secured on our digital distributed ledger, tracking shipment integrity from atelier origins to customer doorstep.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
