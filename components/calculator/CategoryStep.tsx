'use client';

import ScrollCarousel from './ScrollCarousel';
import { categoryIcon } from '@/components/icons/BbqIcons';
import { getCategoriesForMethod, getMeatCategories } from '@/lib/calculator';
import type { CookingMethod } from '@/types/calculator';

interface Props {
  method: CookingMethod | null;
  selected: string | null;
  onSelect: (categoryId: string) => void;
  onBack: () => void;
}

export default function CategoryStep({ method, onSelect, onBack }: Props) {
  const categories = method ? getCategoriesForMethod(method) : getMeatCategories();

  const items = categories.map((cat) => ({
    id: cat.id,
    icon: categoryIcon(cat.id),
    label: cat.name,
    sublabel: `${cat.cuts.length} cuts`,
  }));

  return (
    <ScrollCarousel
      items={items}
      onSelect={onSelect}
      title="What are you cooking?"
      subtitle="Scroll to browse, then tap to choose"
      onBack={onBack}
      ctaPrefix="Choose"
    />
  );
}
