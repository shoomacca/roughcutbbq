export interface GearItem {
  slug: string;
  name: string;
  category: string;
  description: string;
  affiliateUrl: string;
}

export const GEAR: GearItem[] = [
  // ── Thermometers ─────────────────────────────────────────────────────────────
  {
    slug: 'meater-plus',
    name: 'MEATER Plus Smart Thermometer',
    category: 'Thermometers',
    description: 'Wireless probe + app guides you through the brisket stall, alerts when meat is ready.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=MEATER+Plus+Smart+Thermometer&tag=bsbsbs0f-22',
  },
  {
    slug: 'thermapen-one',
    name: 'ThermoWorks Thermapen ONE',
    category: 'Thermometers',
    description: '1-second ±0.3°C accuracy — perfect for spot-checking chicken, ribs, and brisket.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=ThermoWorks+Therapen+ONE&tag=bsbsbs0f-22',
  },
  {
    slug: 'thermoworks-dot',
    name: 'ThermoWorks Dot Alarm Thermometer',
    category: 'Thermometers',
    description: 'Set-and-forget high/low temp alarms — ideal for monitoring long low-and-slow smokes.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=ThermoWorks+Dot+Thermometer&tag=bsbsbs0f-22',
  },
  {
    slug: 'inkbird-ibt4xs',
    name: 'Inkbird IBT-4XS Bluetooth Thermometer',
    category: 'Thermometers',
    description: 'Dual-probe, app-controlled — monitors meat and smoker temp simultaneously.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Inkbird+IBT-4XS+Bluetooth+Thermometer&tag=bsbsbs0f-22',
  },

  // ── Safety & Protection ───────────────────────────────────────────────────────
  {
    slug: 'grill-heat-aid-gloves',
    name: 'Grill Heat Aid Silicone Gloves',
    category: 'Safety & Protection',
    description: '800°C heat protection — grab hot brisket or ribs straight off the grate safely.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Grill+Heat+Aid+Silicone+Gloves&tag=bsbsbs0f-22',
  },
  {
    slug: 'grill-society-gloves',
    name: 'Grill Society Disposable BBQ Gloves',
    category: 'Safety & Protection',
    description: 'Nitrile + reusable liners — keeps hands clean when handling raw meat, no cross-contamination.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Grill+Society+Disposable+BBQ+Gloves&tag=bsbsbs0f-22',
  },

  // ── Tools & Accessories ───────────────────────────────────────────────────────
  {
    slug: 'wiltshire-bar-b-pack',
    name: 'Wiltshire BAR-B PACK Tool Set',
    category: 'Tools & Accessories',
    description: 'Spatula + tongs starter kit — essential for flipping and serving without bark damage.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Wiltshire+BAR-B+PACK+Tool+Set&tag=bsbsbs0f-22',
  },
  {
    slug: 'weber-16-tongs',
    name: 'Weber 16" Stainless Steel Tongs',
    category: 'Tools & Accessories',
    description: 'Long reach, locking mechanism — no bark damage when turning large cuts.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Weber+16+inch+Stainless+Steel+Tongs&tag=bsbsbs0f-22',
  },
  {
    slug: 'oxo-bbq-turner',
    name: 'OXO Good Grips BBQ Turner',
    category: 'Tools & Accessories',
    description: 'Wide, thin edge slides under brisket or fish without tearing — the lifter to own.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=OXO+Good+Grips+BBQ+Turner&tag=bsbsbs0f-22',
  },
  {
    slug: 'grill-rescue-brush',
    name: 'Grill Rescue Grill Brush',
    category: 'Tools & Accessories',
    description: 'No-bristle, steam-cleaning head — safe, effective, lasts for years.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Grill+Rescue+Grill+Brush&tag=bsbsbs0f-22',
  },
  {
    slug: 'grillstone-cleaner',
    name: 'GrillStone Grill Cleaner',
    category: 'Tools & Accessories',
    description: 'Abrasive block cleans grates without chemicals — reusable and eco-friendly.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=GrillStone+Grill+Cleaner&tag=bsbsbs0f-22',
  },
  {
    slug: 'bbq-dragon-firebox',
    name: 'BBQ Dragon Firebox',
    category: 'Tools & Accessories',
    description: 'Perfect charcoal temp control — maintains steady 100–150°C for unattended long cooks.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=BBQ+Dragon+Firebox&tag=bsbsbs0f-22',
  },
  {
    slug: 'bbq-guru-digiq',
    name: 'BBQ Guru DigiQ DX3 Thermostat Controller',
    category: 'Tools & Accessories',
    description: 'Sets and holds smoker temp automatically — ideal for overnight brisket cooks.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=BBQ+Guru+DigiQ+DX3&tag=bsbsbs0f-22',
  },

  // ── Charcoal & Wood ───────────────────────────────────────────────────────────
  {
    slug: 'kingsford-oak-chunks',
    name: 'Kingsford Oak Wood Chunks',
    category: 'Charcoal & Wood',
    description: 'Steady medium smoke — perfect for 12-hour brisket and pork shoulder cooks.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Kingsford+Oak+Wood+Chunks&tag=bsbsbs0f-22',
  },
  {
    slug: 'jack-daniels-chips',
    name: "Jack Daniel's Smoking Wood Chips",
    category: 'Charcoal & Wood',
    description: 'Whiskey-infused flavor — adds a sweet, mellow note to pork and poultry.',
    affiliateUrl: "https://www.amazon.com.au/s?k=Jack+Daniel%27s+Smoking+Wood+Chips&tag=bsbsbs0f-22",
  },
  {
    slug: 'weber-apple-chunks',
    name: 'Weber Apple Wood Chunks',
    category: 'Charcoal & Wood',
    description: 'Light, fruity smoke — ideal for chicken, pork, and fish without bitterness.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Weber+Apple+Wood+Chunks&tag=bsbsbs0f-22',
  },
  {
    slug: 'lumber-jack-apple-pellets',
    name: 'Lumber Jack 100% Apple Wood Pellets',
    category: 'Charcoal & Wood',
    description: 'Pure apple-fruit smoke — works in pellet smokers or smoke tubes.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Lumber+Jack+Apple+Wood+Pellets&tag=bsbsbs0f-22',
  },

  // ── Cookware & Storage ────────────────────────────────────────────────────────
  {
    slug: 'camerons-stovetop-smoker',
    name: 'Camerons Mini Stovetop Smoker',
    category: 'Cookware & Storage',
    description: 'Indoor stovetop smoking — great for fish, cheese, or quick jerky batches.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Camerons+Mini+Stovetop+Smoker&tag=bsbsbs0f-22',
  },
  {
    slug: 'foil-pans',
    name: 'Disposable Aluminum Foil Pans',
    category: 'Cookware & Storage',
    description: 'Catch drips, hold veg or ribs, easy cleanup — a BBQ essential in bulk.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Disposable+Aluminum+Foil+Pans&tag=bsbsbs0f-22',
  },
  {
    slug: 'peach-butcher-paper',
    name: 'Peach Butcher Paper (Pink)',
    category: 'Cookware & Storage',
    description: 'Breathable wrap — keeps brisket moist during the stall without steaming the bark.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Peach+Butcher+Paper&tag=bsbsbs0f-22',
  },
  {
    slug: 'foodsaver-vacuum-sealer',
    name: 'FoodSaver Vacuum Sealer System',
    category: 'Cookware & Storage',
    description: 'Preserves jerky, smoked meat, and prepped cuts — prevents freezer burn completely.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=FoodSaver+Vacuum+Sealer&tag=bsbsbs0f-22',
  },
  {
    slug: 'meat-injector',
    name: 'Stainless Steel Meat Injector',
    category: 'Cookware & Storage',
    description: 'Adds marinades, broths, or butter deep into brisket or pork shoulder.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Stainless+Steel+Meat+Injector&tag=bsbsbs0f-22',
  },
  {
    slug: 'bbq-claws',
    name: 'BBQ Claws (Meat Shredders)',
    category: 'Cookware & Storage',
    description: 'Shred pork shoulder or brisket in seconds — heat-resistant nylon, dishwasher safe.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=BBQ+Claws+Meat+Shredders&tag=bsbsbs0f-22',
  },
  {
    slug: 'grill-light',
    name: 'LED Clip-On Grill Light',
    category: 'Cookware & Storage',
    description: 'Bright, flexible light — essential for night-time cooks and checking doneness.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=LED+Clip+On+Grill+Light&tag=bsbsbs0f-22',
  },
  {
    slug: 'thermometer-calibration',
    name: 'BBQ Thermometer Calibration Kit',
    category: 'Cookware & Storage',
    description: 'Ensures probes read accurately — simple ice bath method, never miss your pull temp.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=BBQ+Thermometer+Calibration+Kit&tag=bsbsbs0f-22',
  },

  // ── Dehydrators ───────────────────────────────────────────────────────────────
  {
    slug: 'cosori-dehydrator',
    name: 'Cosori Stainless Steel Dehydrator',
    category: 'Dehydrators',
    description: 'Top pick for jerky — even horizontal airflow, glass door, quiet motor, 6-tray capacity.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Cosori+Stainless+Steel+Dehydrator&tag=bsbsbs0f-22',
  },
  {
    slug: 'nesco-snackmaster',
    name: 'Nesco Snackmaster Pro Dehydrator',
    category: 'Dehydrators',
    description: 'Great mid-range option — expandable to 20 trays, includes jerky kit and fruit-roll sheets.',
    affiliateUrl: 'https://www.amazon.com.au/s?k=Nesco+Snackmaster+Pro+Dehydrator&tag=bsbsbs0f-22',
  },
];

export const GEAR_CATEGORIES = [
  { id: 'All',                 emoji: '' },
  { id: 'Thermometers',        emoji: '🌡️' },
  { id: 'Safety & Protection', emoji: '🧤' },
  { id: 'Tools & Accessories', emoji: '🛠️' },
  { id: 'Charcoal & Wood',     emoji: '🪵' },
  { id: 'Cookware & Storage',  emoji: '🍳' },
  { id: 'Dehydrators',         emoji: '🌬️' },
];
