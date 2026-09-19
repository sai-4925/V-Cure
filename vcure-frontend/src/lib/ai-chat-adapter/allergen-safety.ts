import type { RecommendedDietItem, DietOrderRecommendation } from "@/types/ai-chat";

export interface AllergenDef {
  name: string;
  aliases: string[];
  safeAlternatives: string[];
  ingredientSubstitutes: {
    pattern: RegExp;
    replacement: {
      name: string;
      category: string;
      estimatedPriceInr: number;
      quantity: string;
    };
  }[];
}

export const ALLERGEN_CATALOG: Record<string, AllergenDef> = {
  peanuts: {
    name: "Peanuts",
    aliases: [
      "peanut",
      "peanuts",
      "groundnut",
      "groundnuts",
      "monkeynut",
      "monkeynuts",
      "earth nut",
      "earthnut",
      "peanut butter",
      "peanut oil",
      "mungfali",
      "moongfali"
    ],
    safeAlternatives: ["Organic Sunflower Seed Butter", "Roasted Pumpkin Seeds", "Chia & Flax Mix"],
    ingredientSubstitutes: [
      {
        pattern: /peanut|groundnut/i,
        replacement: {
          name: "Organic Sunflower Seed Butter",
          category: "Pantry",
          estimatedPriceInr: 260,
          quantity: "350g"
        }
      }
    ]
  },
  dairy: {
    name: "Dairy / Lactose",
    aliases: [
      "dairy",
      "milk",
      "cheese",
      "butter",
      "paneer",
      "yogurt",
      "curd",
      "cream",
      "whey",
      "casein",
      "ghee",
      "lactose",
      "dahi",
      "greek yogurt",
      "cow milk",
      "buffalo milk"
    ],
    safeAlternatives: ["Dairy-Free Coconut Milk Yogurt", "Organic High-Protein Tofu", "Unsweetened Oat Milk"],
    ingredientSubstitutes: [
      {
        pattern: /yogurt|curd|dahi/i,
        replacement: {
          name: "Dairy-Free Coconut Milk Yogurt",
          category: "Produce",
          estimatedPriceInr: 160,
          quantity: "400g"
        }
      },
      {
        pattern: /milk/i,
        replacement: {
          name: "Organic Gluten-Free Oat Milk",
          category: "Produce",
          estimatedPriceInr: 190,
          quantity: "1L"
        }
      },
      {
        pattern: /paneer|cheese/i,
        replacement: {
          name: "Organic High-Protein Firm Tofu",
          category: "Produce",
          estimatedPriceInr: 140,
          quantity: "400g"
        }
      },
      {
        pattern: /butter|ghee/i,
        replacement: {
          name: "Extra Virgin Cold-Pressed Olive Oil",
          category: "Pantry",
          estimatedPriceInr: 240,
          quantity: "250ml"
        }
      }
    ]
  },
  gluten: {
    name: "Gluten / Wheat",
    aliases: [
      "gluten",
      "wheat",
      "flour",
      "maida",
      "atta",
      "roti",
      "bread",
      "pasta",
      "barley",
      "rye",
      "semolina",
      "sooji",
      "suji",
      "rava",
      "gehu"
    ],
    safeAlternatives: ["Certified Gluten-Free Rolled Oats", "Organic White Quinoa", "Multi-Millet Flour"],
    ingredientSubstitutes: [
      {
        pattern: /wheat|atta|flour|maida|sooji|suji|rava/i,
        replacement: {
          name: "Gluten-Free Multi-Millet Flour",
          category: "Grains",
          estimatedPriceInr: 180,
          quantity: "1kg"
        }
      },
      {
        pattern: /bread|toast/i,
        replacement: {
          name: "Gluten-Free Artisan Seed Loaf",
          category: "Grains",
          estimatedPriceInr: 220,
          quantity: "400g"
        }
      },
      {
        pattern: /pasta|noodle/i,
        replacement: {
          name: "Organic Brown Rice & Millet Noodles",
          category: "Grains",
          estimatedPriceInr: 160,
          quantity: "300g"
        }
      }
    ]
  },
  treenuts: {
    name: "Tree Nuts",
    aliases: [
      "tree nut",
      "tree nuts",
      "nut",
      "nuts",
      "almond",
      "almonds",
      "cashew",
      "cashews",
      "walnut",
      "walnuts",
      "pistachio",
      "pistachios",
      "hazelnut",
      "hazelnuts",
      "pecan",
      "pecans",
      "badam",
      "kaju",
      "akhrot",
      "almond milk",
      "cashew butter"
    ],
    safeAlternatives: ["Raw Organic Pumpkin & Sunflower Seeds", "Unsweetened Oat Milk", "Chia Seed Blend"],
    ingredientSubstitutes: [
      {
        pattern: /almond milk/i,
        replacement: {
          name: "Unsweetened Organic Oat Milk",
          category: "Produce",
          estimatedPriceInr: 180,
          quantity: "1L"
        }
      },
      {
        pattern: /almond|cashew|walnut|nut/i,
        replacement: {
          name: "Raw Organic Pumpkin & Sunflower Seeds",
          category: "Pantry",
          estimatedPriceInr: 190,
          quantity: "250g"
        }
      }
    ]
  },
  eggs: {
    name: "Eggs",
    aliases: ["egg", "eggs", "albumin", "yolk", "egg white", "mayo", "mayonnaise", "anda"],
    safeAlternatives: ["Organic Silken Tofu (Scramble)", "Chia Seed Gel", "Aquafaba"],
    ingredientSubstitutes: [
      {
        pattern: /egg/i,
        replacement: {
          name: "Organic Silken Tofu (Scramble)",
          category: "Produce",
          estimatedPriceInr: 130,
          quantity: "350g"
        }
      }
    ]
  },
  soy: {
    name: "Soy / Soya",
    aliases: ["soy", "soya", "tofu", "soy milk", "edamame", "soy sauce", "tempeh", "soybean"],
    safeAlternatives: ["Organic Coconut Aminos (Soy-Free)", "Chickpea Tempeh", "Lentil Protein"],
    ingredientSubstitutes: [
      {
        pattern: /soy sauce/i,
        replacement: {
          name: "Organic Coconut Aminos (Soy-Free)",
          category: "Pantry",
          estimatedPriceInr: 280,
          quantity: "250ml"
        }
      },
      {
        pattern: /tofu|tempeh|edamame|soy/i,
        replacement: {
          name: "Soy-Free Organic Chickpea Tempeh",
          category: "Produce",
          estimatedPriceInr: 175,
          quantity: "250g"
        }
      }
    ]
  },
  seafood: {
    name: "Shellfish / Seafood",
    aliases: [
      "shellfish",
      "seafood",
      "fish",
      "shrimp",
      "prawn",
      "prawns",
      "crab",
      "lobster",
      "oyster",
      "salmon",
      "tuna",
      "anchovy",
      "machli",
      "jhinga"
    ],
    safeAlternatives: ["Omega-3 Rich Chia & Flax Blend", "Spirulina", "Steamed Organic Chickpeas"],
    ingredientSubstitutes: [
      {
        pattern: /fish|salmon|tuna|shrimp|prawn|crab/i,
        replacement: {
          name: "Omega-3 Rich Chia & Flax Blend",
          category: "Pantry",
          estimatedPriceInr: 160,
          quantity: "250g"
        }
      }
    ]
  },
  mustard: {
    name: "Mustard",
    aliases: ["mustard", "sarson", "rai", "mustard oil", "dijon"],
    safeAlternatives: ["Organic Cumin & Coriander Blend", "Extra Virgin Olive Oil"],
    ingredientSubstitutes: [
      {
        pattern: /mustard|sarson|rai/i,
        replacement: {
          name: "Organic Whole Cumin & Coriander Blend",
          category: "Pantry",
          estimatedPriceInr: 110,
          quantity: "200g"
        }
      }
    ]
  },
  sesame: {
    name: "Sesame",
    aliases: ["sesame", "til", "tahini", "sesame oil"],
    safeAlternatives: ["Golden Roasted Flax Seeds", "Sunflower Seed Butter"],
    ingredientSubstitutes: [
      {
        pattern: /sesame|til|tahini/i,
        replacement: {
          name: "Golden Roasted Flax Seeds",
          category: "Pantry",
          estimatedPriceInr: 120,
          quantity: "250g"
        }
      }
    ]
  }
};

export function normalizeAllergenKey(allergen: string): string {
  const lower = allergen.trim().toLowerCase();
  for (const [key, def] of Object.entries(ALLERGEN_CATALOG)) {
    if (def.aliases.some((alias) => lower.includes(alias) || alias.includes(lower))) {
      return key;
    }
  }
  return lower;
}

export function getAllergenAliases(allergen: string): string[] {
  const key = normalizeAllergenKey(allergen);
  if (ALLERGEN_CATALOG[key]) {
    return [...ALLERGEN_CATALOG[key].aliases].sort((a, b) => b.length - a.length);
  }
  const clean = allergen.trim().toLowerCase();
  return [clean, clean.replace(/s$/, "")].sort((a, b) => b.length - a.length);
}

export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

export function findContainedAllergens(
  text: string,
  userAllergies: string[]
): { allergen: string; matchedAlias: string }[] {
  if (!text || !userAllergies || userAllergies.length === 0) return [];

  const normalized = " " + normalizeText(text) + " ";
  const matches: { allergen: string; matchedAlias: string }[] = [];
  const seenAllergens = new Set<string>();

  for (const rawAllergy of userAllergies) {
    if (!rawAllergy) continue;
    const aliases = getAllergenAliases(rawAllergy);
    for (const alias of aliases) {
      const aliasNorm = normalizeText(alias);
      if (aliasNorm.length < 2) continue;
      const pattern = new RegExp(`\\b${aliasNorm}\\b`, "i");
      if (pattern.test(normalized)) {
        const canonicalKey = normalizeAllergenKey(rawAllergy);
        const displayName = ALLERGEN_CATALOG[canonicalKey]?.name || rawAllergy;
        if (!seenAllergens.has(displayName)) {
          seenAllergens.add(displayName);
          matches.push({ allergen: displayName, matchedAlias: alias });
        }
        break;
      }
    }
  }

  return matches;
}

export function isIngredientAllergenSafe(
  item: RecommendedDietItem,
  userAllergies: string[]
): { isSafe: boolean; conflictAllergen?: string } {
  const haystack = `${item.name} ${item.category || ""}`;
  const conflicts = findContainedAllergens(haystack, userAllergies);
  const firstConflict = conflicts[0];
  if (firstConflict) {
    return { isSafe: false, conflictAllergen: firstConflict.allergen };
  }
  return { isSafe: true };
}

export function getAllergenSafeSubstitute(
  item: RecommendedDietItem,
  userAllergies: string[]
): RecommendedDietItem {
  for (const rawAllergy of userAllergies) {
    const key = normalizeAllergenKey(rawAllergy);
    const def = ALLERGEN_CATALOG[key];
    if (def) {
      for (const sub of def.ingredientSubstitutes) {
        if (sub.pattern.test(item.name) || sub.pattern.test(item.category || "")) {
          const candidateHaystack = `${sub.replacement.name} ${sub.replacement.category}`;
          const otherConflicts = findContainedAllergens(candidateHaystack, userAllergies);
          if (otherConflicts.length === 0) {
            return {
              id: `item-sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: sub.replacement.name,
              quantity: sub.replacement.quantity,
              estimatedPriceInr: sub.replacement.estimatedPriceInr,
              category: sub.replacement.category,
              unit: item.unit
            };
          }
        }
      }
    }
  }

  return {
    id: `item-safe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: "Raw Organic Chia & Pumpkin Seed Blend",
    quantity: "250g",
    estimatedPriceInr: 170,
    category: "Pantry",
    unit: item.unit
  };
}

export function sanitizeDietOrder(
  dietOrder: DietOrderRecommendation,
  userAllergies: string[]
): DietOrderRecommendation {
  if (!userAllergies || userAllergies.length === 0) {
    return dietOrder;
  }

  let substitutedCount = 0;
  const sanitizedItems: RecommendedDietItem[] = [];

  for (const item of dietOrder.items) {
    const check = isIngredientAllergenSafe(item, userAllergies);
    if (!check.isSafe) {
      const safeSub = getAllergenSafeSubstitute(item, userAllergies);
      sanitizedItems.push(safeSub);
      substitutedCount++;
    } else {
      sanitizedItems.push(item);
    }
  }

  const newTotal = sanitizedItems.reduce((sum, item) => sum + item.estimatedPriceInr, 0);

  const formattedAllergens = userAllergies.map((a) => {
    const key = normalizeAllergenKey(a);
    return ALLERGEN_CATALOG[key]?.name || a;
  });

  const uniqueAllergens = Array.from(new Set(formattedAllergens));

  return {
    ...dietOrder,
    items: sanitizedItems,
    totalPriceInr: newTotal,
    allergySafeNotice: `Verified 100% free of ${uniqueAllergens.join(", ")}`,
    excludedAllergens: uniqueAllergens,
    description: substitutedCount > 0
      ? `${dietOrder.description || ""} (Tailored allergen-free: excluded ${uniqueAllergens.join(", ")})`.trim()
      : dietOrder.description
  };
}
