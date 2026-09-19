"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  CheckCircle2,
  Truck,
  ArrowRight,
  Sparkles,
  MapPin,
  CreditCard,
  X,
  Clock,
  ShieldCheck
} from "lucide-react";
import type { DietOrderRecommendation } from "@/types/ai-chat";
import { useShoppingCartStore } from "@/store/shopping-cart-store";
import { shoppingService } from "@/services/shopping-service";

interface DietOrderCardProps {
  dietOrder: DietOrderRecommendation;
}

export function DietOrderCard({ dietOrder }: DietOrderCardProps) {
  const addItemsToCart = useShoppingCartStore((state) => state.addItems);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    () => new Set(dietOrder.items.map((item) => item.id))
  );
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [addedToCartToast, setAddedToCartToast] = useState(false);

  // Filter items selected by user
  const selectedItems = dietOrder.items.filter((item) => selectedItemIds.has(item.id));
  const currentTotal = selectedItems.reduce((sum, item) => sum + item.estimatedPriceInr, 0);

  const toggleItem = (id: string) => {
    if (orderPlaced) return;
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id); // Keep at least one selected
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddToCart = () => {
    const cartItems = selectedItems.map((item) => ({
      id: `cart-${item.id}-${Date.now()}`,
      name: `${item.name} (${item.quantity})`,
      quantity: item.quantity,
      unitCount: 1,
      estimatedCost: item.estimatedPriceInr,
      category: item.category || "Diet Recommendations"
    }));

    addItemsToCart(cartItems);
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 4000);
  };

  const handleOpenCheckout = () => {
    setIsCheckoutOpen(true);
  };

  const handleConfirmOrder = async () => {
    setIsPlacingOrder(true);
    try {
      // Add items to cart & log purchase
      const cartItems = selectedItems.map((item) => ({
        id: `cart-${item.id}-${Date.now()}`,
        name: `${item.name} (${item.quantity})`,
        quantity: item.quantity,
        unitCount: 1,
        estimatedCost: item.estimatedPriceInr,
        category: item.category || "Diet Recommendations"
      }));
      addItemsToCart(cartItems);

      try {
        await shoppingService.logPurchase(currentTotal);
      } catch (err) {
        console.warn("Error logging purchase to backend:", err);
      }

      const generatedId = `VC-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(generatedId);
      setOrderPlaced(true);
      setIsCheckoutOpen(false);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="mt-3.5 overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-white to-emerald-50/30 p-4 shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              {dietOrder.title}
              <span className="flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-md">
                <Sparkles className="h-2.5 w-2.5 mr-0.5 text-emerald-600" /> Recommended
              </span>
            </h4>
            <p className="text-[11px] text-gray-500">
              {dietOrder.description || "Fresh ingredients to prepare your recommended meals"}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-extrabold text-emerald-800">₹{currentTotal}</div>
          <div className="text-[10px] text-gray-400">{selectedItems.length} items</div>
        </div>
      </div>

      {/* Allergen-Safe Verification Tag */}
      {dietOrder.excludedAllergens && dietOrder.excludedAllergens.length > 0 ? (
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-medium text-emerald-800 shadow-2xs">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            <strong className="font-semibold">Allergen Safe:</strong> 100% free of{" "}
            {dietOrder.excludedAllergens.join(", ")}
          </span>
        </div>
      ) : null}

      {/* Itemized list */}
      <div className="my-3 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white/90 px-3">
        {dietOrder.items.map((item) => {
          const isSelected = selectedItemIds.has(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`flex items-center justify-between py-2 text-xs transition-colors cursor-pointer ${
                isSelected ? "text-gray-800" : "text-gray-400 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleItem(item.id)}
                  disabled={orderPlaced}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium">{item.name}</span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                  {item.quantity}
                </span>
              </div>
              <span className="font-semibold text-gray-900">₹{item.estimatedPriceInr}</span>
            </div>
          );
        })}
      </div>

      {/* Order Status or Action Buttons */}
      {orderPlaced ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Order Placed Successfully!</span>
            </div>
            <span className="font-mono text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
              {orderId}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700">
            <span className="flex items-center gap-1">
              <Truck className="h-3 w-3" /> Arriving in 30–45 mins
            </span>
            <Link
              href="/shopping"
              className="font-bold underline hover:text-emerald-900 flex items-center gap-0.5"
            >
              Track in Shopping <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pt-1">
          {/* Primary: Direct Place Order Button */}
          <button
            type="button"
            onClick={handleOpenCheckout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.99]"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Directly Place Order • ₹{currentTotal}
          </button>

          {/* Secondary: Add to Cart button */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-semibold text-gray-700 shadow-2xs hover:border-emerald-300 hover:bg-emerald-50 transition-all text-center"
            >
              Add {selectedItems.length} items to cart
            </button>
            <Link
              href="/shopping"
              className="rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-semibold text-gray-700 shadow-2xs hover:border-emerald-300 hover:bg-emerald-50 transition-all text-center flex items-center gap-1"
            >
              Go to Cart <ArrowRight className="h-3 w-3 text-gray-400" />
            </Link>
          </div>

          {addedToCartToast && (
            <div className="flex items-center justify-between rounded-lg bg-emerald-100/90 px-3 py-1.5 text-[11px] font-semibold text-emerald-800">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Added {selectedItems.length} items to cart!
              </span>
              <Link href="/shopping" className="underline font-bold hover:text-emerald-950">
                View cart
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Direct Order Modal */}
      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-2xs transition-all"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-gray-900">Direct Diet Order Checkout</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-3.5 text-xs">
              {/* Delivery Address */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                <div className="flex items-center justify-between text-gray-500 font-medium mb-1">
                  <span className="flex items-center gap-1 font-bold text-gray-700">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Delivery Address
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Home</span>
                </div>
                <p className="font-semibold text-gray-800">Flat 402, Green Meadows, Jubilee Hills</p>
                <p className="text-gray-500">Hyderabad, Telangana - 500033</p>
              </div>

              {/* Delivery ETA */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-emerald-900">
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>Estimated Delivery</span>
                </div>
                <span className="font-bold text-emerald-700">30–45 minutes</span>
              </div>

              {/* Order Items Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Items to be delivered ({selectedItems.length})
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-800"
                    >
                      <span>
                        {item.name} <span className="text-gray-400 font-normal">({item.quantity})</span>
                      </span>
                      <span className="font-semibold">₹{item.estimatedPriceInr}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                <span className="flex items-center gap-1 font-bold text-gray-700 mb-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> Payment Option
                </span>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800">
                    <input
                      type="radio"
                      name="payment"
                      defaultChecked
                      className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Cash on Delivery (Pay on receipt)</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Recommended
                  </span>
                </div>
              </div>

              {/* Total Summary */}
              <div className="border-t border-gray-100 pt-2 space-y-1">
                <div className="flex justify-between text-gray-500">
                  <span>Items Subtotal</span>
                  <span>₹{currentTotal}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between font-extrabold text-gray-900 text-sm pt-1 border-t border-gray-100">
                  <span>Total Amount</span>
                  <span>₹{currentTotal}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                disabled={isPlacingOrder}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 px-4 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isPlacingOrder || selectedItems.length === 0}
                className="flex-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPlacingOrder ? (
                  <span>Placing Order...</span>
                ) : (
                  <>
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Confirm & Place Order (₹{currentTotal})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
