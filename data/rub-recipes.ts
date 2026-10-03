// Scratch-made rub recipes, measured by parts (RC-13.5 content-parity port from the retired
// roughcut.com.au/rubs.html, backup 2026-10-03). The old page had these four; nothing else on it
// was missing from the app. Rendered at the foot of /rubs so the 301 from the old page lands on a
// page that still has them.

export interface RubRecipe {
  slug: string;
  name: string;
  /** Matches a RUB_CATEGORIES id so it sits under the same heading as the shop list. */
  category: string;
  ingredients: { item: string; parts: number }[];
}

export const RUB_RECIPES: RubRecipe[] = [
  {
    slug: 'texas-dalmatian',
    name: 'Texas Dalmatian Rub',
    category: 'Beef & Brisket',
    ingredients: [
      { item: 'Coarse kosher salt', parts: 2 },
      { item: 'Coarse cracked black pepper (16 mesh)', parts: 2 },
      { item: 'Granulated garlic', parts: 0.5 },
      { item: 'Onion powder', parts: 0.25 },
    ],
  },
  {
    slug: 'sweet-carolina',
    name: 'Sweet Carolina Rub',
    category: 'Pork & Ribs',
    ingredients: [
      { item: 'Brown sugar', parts: 3 },
      { item: 'Smoked paprika', parts: 2 },
      { item: 'Kosher salt', parts: 2 },
      { item: 'Garlic powder and onion powder', parts: 1 },
      { item: 'Mustard powder and cayenne', parts: 1 },
    ],
  },
  {
    slug: 'herbed-smoker',
    name: 'Herbed Smoker Rub',
    category: 'Poultry & Chicken',
    ingredients: [
      { item: 'Garlic powder', parts: 2 },
      { item: 'Coarse salt', parts: 2 },
      { item: 'Onion powder', parts: 1 },
      { item: 'Dried thyme and sage', parts: 1 },
      { item: 'Black pepper', parts: 1 },
    ],
  },
  {
    slug: 'citrus-dill',
    name: 'Citrus Dill Rub',
    category: 'Fish & Seafood',
    ingredients: [
      { item: 'Lemon pepper', parts: 2 },
      { item: 'Dried dill weed', parts: 1.5 },
      { item: 'Kosher salt', parts: 1 },
      { item: 'Garlic powder', parts: 1 },
      { item: 'Cayenne pepper', parts: 0.25 },
    ],
  },
];

/** "2 parts", "0.5 part", "1 part" */
export function formatParts(n: number): string {
  return `${n} ${n === 1 ? 'part' : 'parts'}`;
}
