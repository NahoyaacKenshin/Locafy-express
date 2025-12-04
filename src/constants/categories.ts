// constants/categories.ts
// Define the allowed categories for your business directory

export const CATEGORIES = {
  FOOD_DINING: 'food-dining',
  TRANSPORTATION: 'transportation',
  ACCOMMODATION: 'accommodation',
  RETAIL_SHOPS: 'retail-shops',
  SERVICES: 'services',
  ENTERTAINMENT: 'entertainment'
} as const;

export type CategoryValue = typeof CATEGORIES[keyof typeof CATEGORIES];

export const CATEGORY_LABELS: Record<CategoryValue, string> = {
  [CATEGORIES.FOOD_DINING]: 'Food & Dining',
  [CATEGORIES.TRANSPORTATION]: 'Transportation',
  [CATEGORIES.ACCOMMODATION]: 'Accommodation',
  [CATEGORIES.RETAIL_SHOPS]: 'Retail Shops',
  [CATEGORIES.SERVICES]: 'Services',
  [CATEGORIES.ENTERTAINMENT]: 'Entertainment'
};

export interface CategoryOption {
  value: CategoryValue;
  label: string;
}

export const CATEGORY_LIST: CategoryOption[] = [
  { value: CATEGORIES.FOOD_DINING, label: CATEGORY_LABELS[CATEGORIES.FOOD_DINING] },
  { value: CATEGORIES.TRANSPORTATION, label: CATEGORY_LABELS[CATEGORIES.TRANSPORTATION] },
  { value: CATEGORIES.ACCOMMODATION, label: CATEGORY_LABELS[CATEGORIES.ACCOMMODATION] },
  { value: CATEGORIES.RETAIL_SHOPS, label: CATEGORY_LABELS[CATEGORIES.RETAIL_SHOPS] },
  { value: CATEGORIES.SERVICES, label: CATEGORY_LABELS[CATEGORIES.SERVICES] },
  { value: CATEGORIES.ENTERTAINMENT, label: CATEGORY_LABELS[CATEGORIES.ENTERTAINMENT] }
];

export const isValidCategory = (category: string): category is CategoryValue => {
  return Object.values(CATEGORIES).includes(category as CategoryValue);
};