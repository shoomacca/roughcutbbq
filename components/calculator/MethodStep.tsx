'use client';

import ScrollCarousel from './ScrollCarousel';
import { methodIcon } from '@/components/icons/BbqIcons';
import { getMethodsForCategory } from '@/lib/calculator';
import type { CookingMethod } from '@/types/calculator';

const ALL_METHODS = [
  { id: 'smoker',          icon: methodIcon('smoker'), label: 'Smoker',          sublabel: 'Low & slow · 110°C'    },
  { id: 'oven',            icon: methodIcon('oven'), label: 'Oven',            sublabel: 'Roasting · 150°C'      },
  { id: 'slow_cooker',     icon: methodIcon('slow_cooker'), label: 'Slow Cooker',     sublabel: 'Low & slow · 8–10 hrs' },
  { id: 'pressure_cooker', icon: methodIcon('pressure_cooker'), label: 'Pressure Cooker', sublabel: 'Fast · 121°C / 15 PSI' },
  { id: 'kamado',          icon: methodIcon('kamado'), label: 'Kamado',          sublabel: 'Ceramic · 110–200°C'   },
  { id: 'charcoal_kettle', icon: methodIcon('charcoal_kettle'), label: 'Charcoal Kettle', sublabel: 'Indirect · 110–130°C'  },
  { id: 'wood_fire',       icon: methodIcon('wood_fire'), label: 'Wood Fire',       sublabel: 'High heat · 280–350°C' },
  { id: 'rotisserie',      icon: methodIcon('rotisserie'), label: 'Rotisserie',      sublabel: 'Spit · 180°C'          },
  { id: 'dehydrator',      icon: methodIcon('dehydrator'), label: 'Dehydrator',      sublabel: 'Drying · 57°C'         },
];

interface Props {
  selected: CookingMethod | null;
  categoryId: string | null;
  onSelect: (method: CookingMethod) => void;
  onBack?: () => void;
}

export default function MethodStep({ categoryId, onSelect, onBack }: Props) {
  const available = categoryId ? getMethodsForCategory(categoryId) : ALL_METHODS.map((m) => m.id as CookingMethod);
  const items = ALL_METHODS.filter((m) => available.includes(m.id as CookingMethod));

  return (
    <ScrollCarousel
      items={items}
      onSelect={(id) => onSelect(id as CookingMethod)}
      title="How are you cooking it?"
      subtitle="Scroll to browse, then tap to choose"
      ctaPrefix="Cook with"
      onBack={onBack}
    />
  );
}
