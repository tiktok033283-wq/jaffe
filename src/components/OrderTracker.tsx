import React, { useState } from "react";
import { Package, Truck, Compass, CheckCircle2, RefreshCw, Send, Sparkles, MapPin, Search } from "lucide-react";
import { Order, OrderStatus, TrackingUpdate } from "../types";

interface OrderTrackerProps {
  orders: Order[];
  onAdvanceOrder: (orderId: string) => Promise<void>;
  onGenerateAILog: (orderId: string, customLocation: string) => Promise<void>;
  loadingAction: boolean;
}

export default function OrderTracker({
  orders,
  onAdvanceOrder,
  onGenerateAILog,
  loadingAction,
}: OrderTrackerProps) {
  const [searchTracking, setSearchTracking] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    orders.length > 0 ? orders[0] : null
  );
  const [customLocation, setCustomLocation] = useState("");
  const [searchError, setSearchError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    const trimmed = searchTracking.trim().toUpperCase();

    if (!trimmed) return;

    const found = orders.find(
      (o) => o.trackingNumber === trimmed || o.id === trimmed
    );

    if (found) {
      setSelectedOrder(found);
    } else {
      setSearchError("No order found with that reference code.");
    }
  };

  // Status mapping
  const statusSteps: { status: OrderStatus; label: string; icon: any }[] = [
    { status: "placed", label: "Registry Placed", icon: Package },
    { status: "processing", label: "Artisan Preparation", icon: Sparkles },
    { status: "shipped", label: "Dispatched", icon: Compass },
    { status: "out_for_delivery", label: "Out for Delivery", icon: Truck },
    { status: "delivered", label: "Hand Delivered", icon: CheckCircle2 },
  ];

  // Helper to determine step visual state
  const getStepState = (stepStatus: OrderStatus, currentStatus: OrderStatus) => {
    const sequence: OrderStatus[] = [
      "placed",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
    ];
    const stepIndex = sequence.indexOf(stepStatus);
    const currentIndex = sequence.indexOf(currentStatus);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "upcoming";
  };

  // Active status step calculation
  const currentStepIndex = selectedOrder
    ? ["placed", "processing", "shipped", "out_for_delivery", "delivered"].indexOf(
        selectedOrder.status
      )
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12" id="order-tracker-view">
      
      {/* Search Tracker Section */}
      <div className="bg-neutral-50 p-8 border border-neutral-200 mb-10 text-center">
        <h2 className="font-sans text-xs font-semibold tracking-[0.25em] text-neutral-400 uppercase mb-2">
          Courier Tracking Registry
        </h2>
        <p className="font-sans text-lg font-medium text-black uppercase tracking-widest mb-6">
          Track Your Atelier Shipment
        </p>

        <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            placeholder="ENTER TRACKING # (e.g. JFXXXXX)"
            value={searchTracking}
            onChange={(e) => setSearchTracking(e.target.value)}
            className="flex-grow px-4 py-3 bg-white border border-neutral-300 text-xs font-mono tracking-widest text-black focus:outline-none focus:border-black uppercase"
          />
          <button
            type="submit"
            className="bg-black hover:bg-neutral-800 text-white px-6 py-3 text-xs font-semibold tracking-widest uppercase transition-colors flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">TRACK</span>
          </button>
        </form>

        {searchError && (
          <p className="text-[10px] text-red-500 font-mono tracking-wide mt-3">
            {searchError}
          </p>
        )}

        {/* Quick select orders of current customer */}
        {orders.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] font-sans text-neutral-400 uppercase tracking-widest mr-2">
              Your Orders:
            </span>
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setSelectedOrder(o);
                  setSearchError("");
                }}
                className={`text-[10px] font-mono px-3 py-1 border transition-colors ${
                  selectedOrder?.id === o.id
                    ? "border-black bg-black text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-black"
                }`}
              >
                {o.trackingNumber} ({o.id})
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedOrder ? (
        <div className="space-y-10 animate-fade-in" id={`tracking-order-${selectedOrder.id}`}>
          
          {/* Order Identity Grid */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border border-neutral-100 bg-white gap-4">
            <div>
              <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">
                Order Reference
              </span>
              <h3 className="text-sm font-semibold font-mono text-black">
                {selectedOrder.id}
              </h3>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">
                Courier Tracking Code
              </span>
              <h3 className="text-sm font-bold font-mono text-black text-indigo-600">
                {selectedOrder.trackingNumber}
              </h3>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-sans uppercase tracking-widest block">
                Destination
              </span>
              <h3 className="text-xs font-sans font-medium text-neutral-800 uppercase tracking-wider">
                {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}
              </h3>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-sans uppercase tracking-widest block">
                Parcel Weight / Size
              </span>
              <h3 className="text-xs font-sans font-medium text-neutral-800 uppercase tracking-wider">
                {selectedOrder.items.reduce((sum, i) => sum + i.quantity, 0)} items | Premium Crate
              </h3>
            </div>
          </div>

          {/* Visual Step Timeline */}
          <div className="bg-white border border-neutral-100 p-8">
            <div className="grid grid-cols-5 relative">
              {/* Connector line background */}
              <div className="absolute top-[18px] left-[10%] right-[10%] h-[2px] bg-neutral-100 -z-0" />
              {/* Connector line progress */}
              <div 
                className="absolute top-[18px] left-[10%] h-[2px] bg-black -z-0 transition-all duration-1000 ease-in-out" 
                style={{ width: `${(currentStepIndex / 4) * 80}%` }}
              />

              {statusSteps.map((step, idx) => {
                const state = getStepState(step.status, selectedOrder.status);
                const StepIcon = step.icon;

                return (
                  <div key={step.status} className="flex flex-col items-center text-center z-10">
                    {/* Circle */}
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 bg-white ${
                        state === "completed"
                          ? "border-black text-white bg-black"
                          : state === "active"
                          ? "border-black text-black ring-4 ring-neutral-100 scale-105"
                          : "border-neutral-200 text-neutral-300"
                      }`}
                    >
                      <StepIcon className="w-4 h-4 stroke-[1.75]" />
                    </div>

                    {/* Label */}
                    <span
                      className={`text-[9px] uppercase tracking-wider font-sans mt-3 block ${
                        state === "active"
                          ? "text-black font-semibold"
                          : "text-neutral-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIMULATION / DEVELOPER SANDBOX CONTROL */}
          <div className="bg-black text-white p-6 border border-black space-y-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-white" />
              <h4 className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase">
                Artisan Courier Sandbox Mode
              </h4>
            </div>
            
            <p className="font-sans text-xs text-neutral-400 leading-relaxed max-w-2xl">
              Since actual courier scans depend on real vehicles, you can use these controls to manually advance transit steps, or prompt **Gemini AI** to draft customized, luxury brand logistics logs based on custom cities/hubs!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Advance button */}
              <button
                onClick={() => onAdvanceOrder(selectedOrder.id)}
                disabled={selectedOrder.status === "delivered" || loadingAction}
                className="w-full bg-white text-black hover:bg-neutral-100 text-[10px] font-semibold tracking-widest uppercase py-3 border border-transparent transition-colors flex items-center justify-center space-x-2 disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAction ? "animate-spin" : ""}`} />
                <span>ADVANCE COURIER STEP</span>
              </button>

              {/* AI Log input & trigger */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="CUSTOM AIRPORT / DEPOT (e.g. Heathrow Hub)"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="flex-grow px-3 py-1.5 bg-neutral-900 border border-neutral-700 text-[10px] font-mono uppercase text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                />
                <button
                  onClick={() => {
                    onGenerateAILog(selectedOrder.id, customLocation);
                    setCustomLocation("");
                  }}
                  disabled={loadingAction}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 text-[10px] font-semibold tracking-widest uppercase transition-all flex items-center space-x-2"
                >
                  <Send className="w-3 h-3" />
                  <span>AI SCAN</span>
                </button>
              </div>

            </div>
          </div>

          {/* Timeline Tracking Updates */}
          <div className="space-y-4">
            <h4 className="font-sans text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
              Artisan Courier Logs
            </h4>

            <div className="bg-white border border-neutral-100 p-6 divide-y divide-neutral-100">
              {selectedOrder.trackingUpdates.map((update, idx) => (
                <div key={update.timestamp + idx} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-2 md:gap-6">
                  
                  {/* Timestamp */}
                  <div className="md:w-36 flex-shrink-0">
                    <span className="font-mono text-[10px] text-neutral-400 block">
                      {new Date(update.timestamp).toLocaleDateString()}
                    </span>
                    <span className="font-mono text-[9px] text-neutral-400 block">
                      {new Date(update.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Location & description */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3 h-3 text-black stroke-[2]" />
                      <span className="font-sans text-[10px] font-semibold tracking-widest uppercase text-black">
                        {update.location}
                      </span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500 uppercase tracking-wider">
                        {update.status}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-neutral-600 leading-relaxed">
                      {update.description}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white border border-neutral-100 p-12 text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full border border-neutral-200 flex items-center justify-center mx-auto text-neutral-300">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-sans text-xs font-semibold tracking-[0.15em] text-black uppercase mb-1">
              No Shipments Selected
            </h4>
            <p className="font-sans text-[11px] text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Register or login to view your order archive, or purchase a garment to generate your custom tracking codes.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
