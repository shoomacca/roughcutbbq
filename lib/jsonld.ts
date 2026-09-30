export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function recipeJsonLd(opts: {
  name: string;
  description: string;
  category: string;
  method: string;
  cut: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: opts.name,
    description: opts.description,
    recipeCategory: opts.category,
    recipeCuisine: 'Barbecue',
    keywords: `${opts.cut}, ${opts.method}, BBQ, low and slow, metric`,
    author: { '@type': 'Organization', name: 'Rough Cut BBQ' },
    url: opts.url,
  };
}

export function cookPlanJsonLd(
  cut: string,
  method: string,
  cookTimeMinutes: number,
  applianceTempC: number,
  internalTempC: number | null
) {
  const steps = [
    {
      '@type': 'HowToStep',
      name: 'Preheat',
      text: `Preheat your ${method} to ${applianceTempC}°C.`,
    },
    {
      '@type': 'HowToStep',
      name: 'Cook',
      text: `Cook ${cut} for approximately ${Math.round(cookTimeMinutes / 60)} hour${Math.round(cookTimeMinutes / 60) === 1 ? '' : 's'}.`,
    },
    internalTempC
      ? {
          '@type': 'HowToStep',
          name: 'Check temperature',
          text: `Remove when internal temperature reaches ${internalTempC}°C.`,
        }
      : null,
    {
      '@type': 'HowToStep',
      name: 'Rest',
      text: 'Rest before slicing to allow juices to redistribute.',
    },
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to cook ${cut} using ${method}`,
    description: `Step-by-step cook plan for ${cut} using ${method}.`,
    totalTime: `PT${cookTimeMinutes}M`,
    tool: [{ '@type': 'HowToTool', name: method }],
    step: steps,
  };
}
