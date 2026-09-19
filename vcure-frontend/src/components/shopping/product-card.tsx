"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Check, ShoppingCart, Apple, Milk, Wheat, Drumstick, Cookie, Coffee, Package } from "lucide-react";
import { AvailabilityBadge } from "@/components/shopping/availability-badge";
import { QuantitySelector } from "@/components/shopping/quantity-selector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/constants/routes";
import { useShoppingCartStore } from "@/store/shopping-cart-store";
import type { GroceryCategory, ProductSummary } from "@/types/shopping";

const PRODUCT_THUMBNAILS: Record<string, string> = {
  "product-quinoa": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&auto=format&fit=crop&q=80",
  "product-brown-rice": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=150&auto=format&fit=crop&q=80",
  "product-greek-yogurt": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=150&auto=format&fit=crop&q=80",
  "product-soy-yogurt": "https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=150&auto=format&fit=crop&q=80",
  "product-spinach": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=150&auto=format&fit=crop&q=80",
  "product-chicken-breast": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=150&auto=format&fit=crop&q=80",
  "product-tofu": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80",
  "product-salted-peanuts": "https://images.unsplash.com/photo-1567892308668-e0454687a90f?w=150&auto=format&fit=crop&q=80",
  "product-roasted-chickpeas": "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=150&auto=format&fit=crop&q=80"
};

function getCategoryIcon(category: GroceryCategory) {
  switch (category) {
    case "Produce":
      return Apple;
    case "Dairy":
      return Milk;
    case "Grains":
      return Wheat;
    case "Protein":
      return Drumstick;
    case "Snacks":
      return Cookie;
    case "Beverages":
      return Coffee;
    default:
      return Package;
  }
}

export function ProductCard({
  product,
  onToggleFavorite
}: {
  product: ProductSummary;
  onToggleFavorite: (productId: string) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const addItems = useShoppingCartStore((state) => state.addItems);

  const thumbnailUrl = PRODUCT_THUMBNAILS[product.id];
  const CategoryIcon = getCategoryIcon(product.category);

  const handleAddToCart = () => {
    addItems([
      {
        id: product.id,
        name: product.name,
        quantity: `${quantity} × ${product.unit}`,
        unitCount: quantity,
        unit: product.unit,
        estimatedCost: product.pricePerUnit * quantity,
        category: product.category,
        nutritionPerUnit: product.nutrition
      }
    ]);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-center overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <CategoryIcon className="h-6 w-6 text-emerald-600" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex items-start justify-between gap-1">
          <Link
            href={`${ROUTES.SHOPPING}/products/${product.id}`}
            className="min-w-0 flex-1 text-sm font-bold text-text-primary hover:text-emerald-700 line-clamp-2 leading-snug"
          >
            {product.name}
          </Link>
          <button
            type="button"
            aria-label={product.isFavorite ? "Remove from favorites" : "Save product"}
            aria-pressed={product.isFavorite}
            onClick={() => onToggleFavorite(product.id)}
            className="shrink-0 rounded-full p-1.5 hover:bg-surface-muted"
          >
            <Heart
              className={cn("h-4 w-4", product.isFavorite ? "fill-danger text-danger" : "text-text-secondary")}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>{product.unit}</span>
        <span className="font-semibold text-text-primary">₹{product.pricePerUnit}</span>
      </div>

      <AvailabilityBadge availability={product.availability} />

      {product.availability !== "OUT_OF_STOCK" ? (
        <>
          <QuantitySelector value={quantity} unit="" onChange={setQuantity} min={1} />
          <Button type="button" variant="outline" size="sm" onClick={handleAddToCart}>
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Added
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                Add to cart
              </>
            )}
          </Button>
        </>
      ) : null}
    </div>
  );
}

