import { useId, type ReactNode } from 'react';

/**
 * One icon family for the whole app: 3px rounded INK outline, SKIN fill, ACC (brand orange)
 * for the "this is the thing" highlight. Every icon is sized 1em so callers set font-size.
 * Hand-drawn inline SVG, no licensing or network cost. Cuts of four-legged animals are drawn
 * as the animal with the cut's primal region highlighted; everything else is a direct picture.
 */
const INK = '#2A5236';
const SKIN = '#FBF8EA';
const ACC = '#E67E22';

function Svg({ vb = '0 0 64 64', children }: { vb?: string; children: ReactNode }) {
  return (
    <svg
      viewBox={vb}
      width="1em"
      height="1em"
      fill={SKIN}
      stroke={INK}
      strokeWidth={vb === '0 0 64 64' ? 3 : 3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      {children}
    </svg>
  );
}
const hl = { fill: ACC } as const; // highlight
const nf = { fill: 'none' } as const;

/* ── Four-legged animals with a highlighted primal region ─────────────────── */
type Animal = 'pig' | 'cow' | 'lamb' | 'deer';
// Silhouette facing left: torso + legs, then head. All regions share this coordinate space.
const BODY =
  'M26 28C34 22 50 20 70 22C86 22 98 24 102 32L104 52C104 56 100 58 96 58L94 76L86 76L86 58L44 58L42 76L34 76L32 56C28 52 26 40 26 28Z';
const HEAD = 'M26 28C18 28 10 34 8 42L8 46C12 50 22 50 28 46Z';
const R = (pts: string) => <polygon points={pts} {...hl} stroke="none" />;
const REGIONS: Record<string, ReactNode> = {
  head: R('0,20 28,20 28,58 0,58'),
  neck: R('22,16 40,16 40,58 22,58'),
  shoulder: R('38,16 60,16 60,50 38,50'),
  blade: R('40,16 62,16 62,32 40,32'),
  bladeEnd: R('50,16 68,16 68,32 50,32'),
  brisket: R('30,42 54,42 54,64 30,64'),
  ribTop: R('56,16 78,16 78,40 56,40'),
  ribLow: R('52,40 80,40 80,62 52,62'),
  belly: R('58,42 94,42 94,62 58,62'),
  loin: R('76,16 94,16 94,34 76,34'),
  tenderloin: <path d="M62 36Q80 41 96 34" stroke={ACC} strokeWidth={7} fill="none" />,
  rump: R('92,16 110,16 110,40 92,40'),
  rumpCap: R('92,16 110,16 110,29 92,29'),
  triTip: R('88,34 106,34 106,48 88,48'),
  leg: R('84,28 110,28 110,80 84,80'),
  hindShank: R('84,56 110,56 110,80 84,80'),
  foreShank: R('26,56 48,56 48,80 26,80'),
  tail: <path d="M104 32C112 34 114 46 110 60" stroke={ACC} strokeWidth={6} fill="none" />,
  none: null,
};
function AnimalExtras({ animal, tail }: { animal: Animal; tail: boolean }) {
  const t = tail ? ACC : INK;
  switch (animal) {
    case 'pig':
      return (
        <>
          <path d="M22 29L30 20L34 32Z" />
          <rect x="3" y="38" width="8" height="10" rx="3" fill="#F2B6B0" />
          <path d="M104 34C114 26 120 38 111 40C106 41 108 35 113 36" {...nf} stroke={t} />
        </>
      );
    case 'cow':
      return (
        <>
          <path d="M20 29C14 28 12 22 14 16M28 27C30 22 34 20 36 14" {...nf} strokeWidth={4.5} />
          <circle cx="44" cy="34" r="5" fill={INK} stroke="none" />
          <circle cx="70" cy="46" r="6" fill={INK} stroke="none" />
          <circle cx="86" cy="30" r="4" fill={INK} stroke="none" />
          <path d="M104 32C108 42 108 54 106 62" {...nf} stroke={t} strokeWidth={tail ? 6 : 3.5} />
          <circle cx="106" cy="64" r="3" fill={t} />
        </>
      );
    case 'lamb':
      return (
        <>
          <path d="M10 44C8 48 14 50 20 48" fill={INK} />
          <path d="M34 28C28 22 36 14 44 18C48 12 58 14 60 18C66 12 76 14 78 20C86 14 96 18 96 26C104 26 106 36 100 40" {...nf} />
          <path d="M28 30C22 32 20 38 24 40" fill={INK} />
          <path d="M104 36L110 38" {...nf} />
        </>
      );
    case 'deer':
      return (
        <>
          <path d="M20 30L14 14L8 8M14 14L22 8M26 28L30 12L38 6M30 12L24 4" {...nf} />
          <path d="M104 32L110 28" {...nf} />
        </>
      );
  }
}
function Quad({ animal, region = 'none' }: { animal: Animal; region?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const tailOnly = region === 'tail';
  return (
    <Svg vb="4 -8 112 112">
      <g transform="translate(0 -14.4) scale(1 1.3)">
      <clipPath id={id}>
        <path d={BODY} />
        <path d={HEAD} />
      </clipPath>
      <path d={BODY} />
      <path d={HEAD} />
      <g clipPath={`url(#${id})`}>{tailOnly ? null : REGIONS[region]}</g>
      <path d={BODY} {...nf} />
      <path d={HEAD} {...nf} />
      <AnimalExtras animal={animal} tail={tailOnly} />
      </g>
    </Svg>
  );
}

/* ── Poultry / game birds ─────────────────────────────────────────────────── */
type BirdKind = 'hen' | 'turkey' | 'duck' | 'quail' | 'pheasant';
function Bird({ kind = 'hen', scale = 1 }: { kind?: BirdKind; scale?: number }) {
  const duck = kind === 'duck';
  const turkey = kind === 'turkey';
  return (
    <Svg>
      <g transform={`translate(${32 - 32 * scale} ${34 - 34 * scale}) scale(${scale})`}>
        {turkey && <path d="M44 34C44 14 62 12 62 30C62 40 54 44 48 44Z" {...hl} />}
        {kind === 'pheasant' && <path d="M48 36L62 52M48 34L64 40M48 32L62 26" {...nf} strokeWidth={4} />}
        {kind === 'hen' && <path d="M48 36C56 34 58 26 56 20C52 26 48 28 46 30Z" />}
        <path d="M26 54V58M40 54V58M22 58H30M36 58H44" {...nf} />
        <ellipse cx="34" cy="40" rx={duck ? 20 : 17} ry={duck ? 11 : 14} />
        <path d="M30 38C34 44 42 44 46 38" {...nf} />
        <path d={duck ? 'M14 34C10 26 14 18 20 20C24 22 22 30 20 34' : 'M20 36C14 30 14 20 18 16'} {...nf} />
        <circle cx={duck ? 17 : 16} cy={duck ? 18 : 16} r="7" />
        <circle cx={duck ? 15 : 14} cy={duck ? 17 : 15} r="1.5" fill={INK} stroke="none" />
        {duck ? <path d="M10 18L2 20L10 24Z" {...hl} /> : <path d="M9 16L3 19L10 21Z" {...hl} />}
        {(kind === 'hen' || turkey) && <path d="M14 9C16 5 20 6 22 9C24 6 27 8 25 11Z" {...hl} />}
        {kind === 'quail' && <path d="M18 9C20 4 24 4 24 8" {...nf} />}
        {turkey && <path d="M12 22C12 28 18 28 18 22Z" {...hl} />}
      </g>
    </Svg>
  );
}
const Spatchcock = () => (
  <Svg>
    <ellipse cx="32" cy="30" rx="13" ry="17" />
    <ellipse cx="13" cy="48" rx="9" ry="5" transform="rotate(-30 13 48)" />
    <ellipse cx="51" cy="48" rx="9" ry="5" transform="rotate(30 51 48)" />
    <ellipse cx="13" cy="20" rx="8" ry="4.5" transform="rotate(30 13 20)" />
    <ellipse cx="51" cy="20" rx="8" ry="4.5" transform="rotate(-30 51 20)" />
    <path d="M32 16V44" stroke={ACC} fill="none" />
  </Svg>
);
const Drumstick = () => (
  <Svg>
    <path d="M10 14C14 6 30 8 38 18C44 26 44 34 38 38C32 42 22 38 16 32C8 26 6 20 10 14Z" />
    <path d="M38 38L50 50" {...nf} />
    <circle cx="53" cy="49" r="3" />
    <circle cx="48" cy="54" r="3" />
    <path d="M16 18C20 14 26 16 30 20" stroke={ACC} fill="none" />
  </Svg>
);
const Wings = () => (
  <Svg>
    <path d="M8 40C8 26 20 14 36 14C46 14 54 20 56 26C50 24 44 28 42 34C40 42 32 50 22 50C14 50 8 46 8 40Z" />
    <path d="M22 50C24 40 30 32 40 28M36 14C32 22 28 28 22 34" {...nf} stroke={ACC} />
  </Svg>
);
const Breast = ({ big = false }: { big?: boolean }) => (
  <Svg>
    <path
      d={
        big
          ? 'M6 44C6 22 20 10 34 10C48 10 58 24 58 44C58 50 50 52 32 52C14 52 6 50 6 44Z'
          : 'M8 42C8 26 20 16 34 16C46 16 56 28 56 42C56 48 46 50 32 50C18 50 8 48 8 42Z'
      }
    />
    <path d="M18 40L26 26M28 42L36 24M38 42L46 28" stroke={ACC} fill="none" />
    {big && <path d="M32 52V58" {...nf} />}
  </Svg>
);
const Rabbit = () => (
  <Svg>
    <ellipse cx="34" cy="42" rx="18" ry="13" />
    <path d="M18 36C14 28 14 14 20 10C26 14 26 26 24 32M28 32C28 22 32 10 38 10C42 14 38 26 34 32" />
    <circle cx="18" cy="38" r="1.6" fill={INK} stroke="none" />
    <circle cx="52" cy="42" r="5" {...hl} />
  </Svg>
);
const Steak = ({ bone = false }: { bone?: boolean }) => (
  <Svg>
    <path d="M8 30C8 16 24 8 40 12C54 16 58 30 52 42C46 54 28 56 18 50C12 46 8 38 8 30Z" fill="#B5483A" />
    <path d="M20 26C26 22 34 22 42 26M20 36C28 32 38 32 46 36" {...nf} stroke={SKIN} strokeWidth={2.5} />
    <path d="M12 30C12 20 26 12 40 15" {...nf} stroke={SKIN} strokeWidth={4} />
    {bone && <circle cx="22" cy="44" r="5" />}
  </Svg>
);

/* ── Fish & seafood ───────────────────────────────────────────────────────── */
const WholeFish = () => (
  <Svg>
    <path d="M6 32C14 18 34 16 46 28L58 18L58 46L46 36C34 48 14 46 6 32Z" />
    <circle cx="16" cy="29" r="2" fill={INK} stroke="none" />
    <path d="M30 22C34 28 34 36 30 42M38 24C41 29 41 35 38 40" {...nf} stroke={ACC} />
  </Svg>
);
const Fillet = () => (
  <Svg>
    <path d="M6 34C14 18 40 14 58 24C50 40 28 52 6 34Z" {...hl} />
    <path d="M14 33C24 27 38 25 50 27M18 40C28 36 38 34 46 34M12 36C20 30 34 28 52 29" {...nf} stroke={SKIN} strokeWidth={2.5} />
    <path d="M6 34C28 52 50 40 58 24" {...nf} />
  </Svg>
);
const FishSteak = () => (
  <Svg>
    <path d="M12 20C20 10 44 10 52 20C58 30 54 48 42 52C38 54 36 48 32 48C28 48 26 54 22 52C10 48 6 30 12 20Z" {...hl} />
    <circle cx="32" cy="22" r="3.5" fill={SKIN} />
    <path d="M32 26V38M20 30C24 32 28 32 28 34M44 30C40 32 36 32 36 34" {...nf} stroke={SKIN} strokeWidth={2.5} />
  </Svg>
);
const Prawn = ({ big = false }: { big?: boolean }) => (
  <Svg>
    <path d="M44 14C54 16 58 26 54 36C50 46 38 52 26 50C20 49 14 44 14 38C14 32 22 32 24 38C26 42 34 42 38 36C42 30 38 20 44 14Z" />
    <path d="M30 40L32 49M38 34L44 42M42 24L50 28" {...nf} stroke={ACC} />
    <path d="M44 14L38 6M44 14L52 8" {...nf} />
    <circle cx="48" cy="20" r="1.5" fill={INK} stroke="none" />
    {big && <path d="M14 38L8 44L12 50" {...nf} />}
  </Svg>
);
const Lobster = () => (
  <Svg>
    <path d="M6 22C12 14 26 14 38 20C44 24 46 28 44 34C42 40 36 42 30 40C20 38 10 32 6 22Z" />
    <path d="M18 18C20 24 20 30 18 34M26 20C28 25 28 31 26 36" {...nf} stroke={ACC} />
    <path d="M42 28L56 20L58 32L56 44L42 38Z" {...hl} />
  </Svg>
);
const Scallop = () => (
  <Svg>
    <path d="M32 52C14 52 6 34 10 24C18 12 46 12 54 24C58 34 50 52 32 52Z" />
    <path d="M32 52L18 18M32 52L26 15M32 52V14M32 52L38 15M32 52L46 18" {...nf} stroke={ACC} />
    <path d="M24 52H40L38 58H26Z" />
  </Svg>
);

/* ── Vegetables ───────────────────────────────────────────────────────────── */
const Corn = () => (
  <Svg>
    <path d="M32 6C44 12 46 36 40 52C36 58 28 58 24 52C18 36 20 12 32 6Z" {...hl} />
    <path d="M26 20H38M24 30H40M25 40H39M32 8V54" {...nf} />
    <path d="M24 56C12 48 10 30 18 20C20 36 24 46 30 54ZM40 56C52 48 54 30 46 20C44 36 40 46 34 54Z" />
  </Svg>
);
const Pepper = () => (
  <Svg>
    <path d="M32 18C20 12 10 20 12 36C14 52 22 58 28 54C30 52 34 52 36 54C42 58 50 52 52 36C54 20 44 12 32 18Z" {...hl} />
    <path d="M32 18V8L40 6" {...nf} />
    <path d="M20 30C20 40 24 46 26 48" {...nf} stroke={SKIN} />
  </Svg>
);
const Eggplant = () => (
  <Svg>
    <path d="M42 14C54 20 58 34 48 46C40 56 26 58 18 52C10 46 12 34 22 26C30 20 36 12 42 14Z" fill="#6B4A8C" />
    <path d="M40 12C46 10 52 14 52 20C46 22 40 20 38 14Z" {...hl} />
    <path d="M44 10L48 4" {...nf} />
    <path d="M22 44C24 40 28 36 32 34" {...nf} stroke={SKIN} />
  </Svg>
);
const Zucchini = () => (
  <Svg>
    <path d="M8 38C8 28 20 22 34 20C46 18 58 22 58 32C58 42 46 48 32 48C18 50 8 46 8 38Z" />
    <path d="M10 36C14 34 20 33 28 32L34 22C24 24 12 28 10 36Z" {...hl} />
    <circle cx="22" cy="41" r="1.8" fill={INK} stroke="none" />
    <circle cx="32" cy="41" r="1.8" fill={INK} stroke="none" />
    <circle cx="42" cy="41" r="1.8" fill={INK} stroke="none" />
  </Svg>
);
const Mushroom = () => (
  <Svg>
    <path d="M6 32C6 18 18 10 32 10C46 10 58 18 58 32C58 36 50 38 32 38C14 38 6 36 6 32Z" {...hl} />
    <path d="M14 36L18 44M24 38L26 46M32 38V47M40 38L38 46M50 36L46 44" {...nf} />
    <path d="M24 44H40V54C40 57 24 57 24 54Z" />
  </Svg>
);
const Garlic = () => (
  <Svg>
    <path d="M32 6C34 14 36 18 42 22C54 28 56 46 46 54C40 58 24 58 18 54C8 46 10 28 22 22C28 18 30 14 32 6Z" />
    <path d="M32 20C26 30 26 44 32 56M32 20C38 30 38 44 32 56" {...nf} stroke={ACC} />
  </Svg>
);
const Cauliflower = () => (
  <Svg>
    <path d="M12 40C2 34 6 20 18 22C20 10 40 10 44 22C58 20 60 36 50 40C48 48 16 48 12 40Z" />
    <path d="M18 40C16 52 30 58 32 58C34 58 48 52 46 40" {...hl} />
    <path d="M24 28C26 32 30 32 32 28M38 30C40 34 44 34 44 30" {...nf} />
  </Svg>
);
const Beetroot = () => (
  <Svg>
    <path d="M32 22C46 22 54 32 52 44C50 54 40 56 32 56C24 56 14 54 12 44C10 32 18 22 32 22Z" fill="#8E2A4A" />
    <path d="M32 56V62" {...nf} />
    <path d="M32 22C28 14 22 10 18 6M32 22C34 14 38 10 44 8M32 22V8" {...nf} />
    <path d="M20 30C18 36 20 42 24 46" {...nf} stroke={SKIN} />
  </Svg>
);
const SweetPotato = () => (
  <Svg>
    <path d="M6 40C6 28 22 18 40 20C52 22 60 28 58 36C56 46 40 52 24 50C12 50 6 46 6 40Z" {...hl} />
    <path d="M14 36C24 32 36 30 50 32M16 44C26 42 38 42 48 40" {...nf} stroke={SKIN} />
  </Svg>
);
const Asparagus = () => (
  <Svg>
    <path d="M14 56L16 24M32 58V22M50 56L48 24" {...nf} strokeWidth={5} />
    <path d="M16 24C10 20 12 12 16 8C20 12 22 20 16 24ZM32 22C26 18 28 8 32 4C36 8 38 18 32 22ZM48 24C42 20 44 12 48 8C52 12 54 20 48 24Z" fill={GREEN} />
  </Svg>
);
const Onion = () => (
  <Svg>
    <path d="M32 6C34 14 40 18 46 24C56 34 52 52 38 56C34 57 30 57 26 56C12 52 8 34 18 24C24 18 30 14 32 6Z" fill="#E3B26B" />
    <path d="M32 14C22 26 20 44 28 56M32 14C42 26 44 44 36 56" {...nf} stroke={ACC} />
    <path d="M26 58L24 62M32 58V62M38 58L40 62" {...nf} />
  </Svg>
);
const Butternut = () => (
  <Svg>
    <path d="M24 6H40C44 20 44 26 52 34C58 42 54 56 32 58C10 56 6 42 12 34C20 26 20 20 24 6Z" fill="#E3A857" />
    <ellipse cx="32" cy="43" rx="11" ry="9" fill="#F6D58E" />
    <circle cx="28" cy="41" r="1.8" fill={INK} stroke="none" />
    <circle cx="35" cy="40" r="1.8" fill={INK} stroke="none" />
    <circle cx="32" cy="47" r="1.8" fill={INK} stroke="none" />
  </Svg>
);
const Tomato = () => (
  <Svg>
    <path d="M32 14C48 12 58 24 56 38C54 52 42 58 32 58C22 58 10 52 8 38C6 24 16 12 32 14Z" {...hl} />
    <path d="M32 14L24 20M32 14L40 20M32 14V24M32 14L22 12M32 14L42 12" {...nf} />
    <path d="M32 14V8" {...nf} />
  </Svg>
);
const GREEN = '#4F8A4B';
const Broccolini = () => (
  <Svg>
    <path d="M32 58V30M20 58V36M44 58V36" {...nf} strokeWidth={4} />
    <circle cx="32" cy="22" r="7" fill={GREEN} />
    <circle cx="20" cy="30" r="6" fill={GREEN} />
    <circle cx="44" cy="30" r="6" fill={GREEN} />
  </Svg>
);
const Broccoli = () => (
  <Svg>
    <path d="M26 58L28 38H36L38 58Z" fill="#9FC48A" />
    <path d="M10 36C0 30 4 16 16 18C18 6 36 4 42 14C54 12 60 28 52 36C46 40 16 42 10 36Z" fill={GREEN} />
  </Svg>
);
const Jerky = () => (
  <Svg>
    <path d="M6 10C14 4 24 14 34 8C44 2 52 8 58 6L56 18C50 20 44 14 36 18C26 24 14 16 6 22Z" fill="#7A3E22" />
    <path d="M6 28C14 22 24 32 34 26C44 20 52 26 58 24L56 36C50 38 44 32 36 36C26 42 14 34 6 40Z" fill="#7A3E22" />
    <path d="M8 46C16 40 26 50 36 44C44 40 50 44 56 42L54 54C48 56 44 52 36 54C26 58 14 52 8 58Z" fill="#7A3E22" />
    <path d="M14 14H16M26 16H28M40 10H42M48 14H50M14 32H16M26 34H28M40 28H42M48 32H50M16 50H18M30 48H32M44 46H46" {...nf} stroke={SKIN} strokeWidth={2.5} />
  </Svg>
);

/* ── Cooking methods ──────────────────────────────────────────────────────── */
const Smoker = () => (
  <Svg>
    <rect x="6" y="28" width="38" height="22" rx="11" />
    <path d="M14 28V50M36 28V50" {...nf} />
    <rect x="46" y="34" width="12" height="16" rx="2" {...hl} />
    <path d="M14 50L10 58M38 50L42 58" {...nf} />
    <path d="M18 28V14H24V28" />
    <path d="M24 10C20 8 24 4 21 2M30 10C27 7 31 4 28 2" {...nf} stroke={ACC} />
  </Svg>
);
const Oven = () => (
  <Svg>
    <rect x="8" y="8" width="48" height="48" rx="5" />
    <path d="M8 20H56" {...nf} />
    <circle cx="18" cy="14" r="2" fill={INK} stroke="none" />
    <circle cx="26" cy="14" r="2" fill={INK} stroke="none" />
    <rect x="14" y="26" width="36" height="22" rx="3" {...hl} />
    <path d="M18 40H46" {...nf} />
  </Svg>
);
const SlowCooker = () => (
  <Svg>
    <path d="M10 30H54V42C54 50 46 56 32 56C18 56 10 50 10 42Z" />
    <path d="M12 30C14 20 24 16 32 16C40 16 50 20 52 30Z" {...hl} />
    <circle cx="32" cy="12" r="3" />
    <path d="M10 34H4M54 34H60" {...nf} />
    <circle cx="32" cy="44" r="3" fill={INK} stroke="none" />
  </Svg>
);
const PressureCooker = () => (
  <Svg>
    <path d="M12 26H52V46C52 52 46 56 32 56C18 56 12 52 12 46Z" />
    <path d="M10 26H54V20H10Z" {...hl} />
    <path d="M28 20V12H36V20" />
    <path d="M32 12V6" {...nf} />
    <path d="M12 32H4V38H12M52 32H60V38H52" {...nf} />
    <circle cx="32" cy="42" r="4" />
  </Svg>
);
const Kamado = () => (
  <Svg>
    <path d="M32 8C46 8 52 22 52 34C52 46 44 52 32 52C20 52 12 46 12 34C12 22 18 8 32 8Z" {...hl} />
    <path d="M12 30H52" {...nf} />
    <rect x="26" y="4" width="12" height="6" rx="2" />
    <path d="M16 52L12 60M48 52L52 60M16 56H48" {...nf} />
  </Svg>
);
const Kettle = () => (
  <Svg>
    <path d="M10 32C10 18 20 12 32 12C44 12 54 18 54 32Z" />
    <path d="M10 32H54V36C54 42 44 46 32 46C20 46 10 42 10 36Z" {...hl} />
    <path d="M28 12C28 8 36 8 36 12" {...nf} />
    <path d="M18 44L12 60M46 44L52 60M32 46V60" {...nf} />
  </Svg>
);
const WoodFire = () => (
  <Svg>
    <path d="M32 6C40 16 46 20 44 30C42 38 36 40 32 40C28 40 22 38 20 30C20 24 26 22 28 14C30 18 31 12 32 6Z" {...hl} />
    <path d="M6 54L48 42M58 54L16 42" strokeWidth={5} />
  </Svg>
);
const Rotisserie = () => (
  <Svg>
    <path d="M4 24H60M6 14V34M58 14V34" {...nf} />
    <ellipse cx="32" cy="24" rx="20" ry="12" fill="#D9A066" />
    <path d="M18 22C24 30 40 30 46 22" {...nf} />
    <path d="M6 60L12 46L19 57L26 44L32 58L38 44L45 57L52 46L58 60Z" {...hl} />
  </Svg>
);
const Dehydrator = () => (
  <Svg>
    <rect x="10" y="6" width="44" height="52" rx="5" />
    <path d="M14 20H50M14 32H50M14 44H50" {...nf} />
    <path d="M18 16C22 12 26 20 30 16C34 12 38 20 42 16M18 28C22 24 26 32 30 28C34 24 38 32 42 28M18 40C22 36 26 44 30 40C34 36 38 44 42 40" {...nf} stroke={ACC} />
  </Svg>
);

/* ── Lookup tables ────────────────────────────────────────────────────────── */
const METHODS: Record<string, ReactNode> = {
  smoker: <Smoker />,
  oven: <Oven />,
  slow_cooker: <SlowCooker />,
  pressure_cooker: <PressureCooker />,
  kamado: <Kamado />,
  charcoal_kettle: <Kettle />,
  wood_fire: <WoodFire />,
  rotisserie: <Rotisserie />,
  dehydrator: <Dehydrator />,
};
const CATEGORIES: Record<string, ReactNode> = {
  pork: <Quad animal="pig" />,
  beef: <Quad animal="cow" />,
  lamb: <Quad animal="lamb" />,
  game: <Quad animal="deer" />,
  chicken: <Bird />,
  fish: <WholeFish />,
  veggies: <Broccoli />,
  jerky: <Jerky />,
};
const q = (animal: Animal, region: string) => <Quad animal={animal} region={region} />;
const CUTS: Record<string, ReactNode> = {
  // pork
  pork_shoulder: q('pig', 'shoulder'),
  baby_back_ribs: q('pig', 'ribTop'),
  pork_belly: q('pig', 'belly'),
  pork_leg: q('pig', 'leg'),
  spare_ribs_st_louis: q('pig', 'ribLow'),
  pork_tenderloin: q('pig', 'tenderloin'),
  pork_cheeks: q('pig', 'head'),
  pork_knuckle: q('pig', 'hindShank'),
  pork_neck_collar: q('pig', 'neck'),
  country_style_ribs: q('pig', 'bladeEnd'),
  bone_in_ham: q('pig', 'leg'),
  // beef
  brisket: q('cow', 'brisket'),
  beef_short_ribs: q('cow', 'ribLow'),
  chuck_roast: q('cow', 'shoulder'),
  tomahawk_steak: q('cow', 'ribTop'),
  rump_roast: q('cow', 'rump'),
  tri_tip: q('cow', 'triTip'),
  beef_cheeks: q('cow', 'head'),
  oxtail: q('cow', 'tail'),
  picanha: q('cow', 'rumpCap'),
  beef_tenderloin: q('cow', 'tenderloin'),
  bolar_blade: q('cow', 'blade'),
  beef_shin: q('cow', 'foreShank'),
  // lamb
  lamb_shoulder: q('lamb', 'shoulder'),
  leg_of_lamb: q('lamb', 'leg'),
  lamb_ribs: q('lamb', 'ribLow'),
  lamb_rack: q('lamb', 'ribTop'),
  lamb_leg_butterflied: q('lamb', 'leg'),
  lamb_neck_chops: q('lamb', 'neck'),
  lamb_shoulder_rolled: q('lamb', 'shoulder'),
  // game
  venison_leg: q('deer', 'leg'),
  venison_shoulder_pulled: q('deer', 'shoulder'),
  wild_boar_shoulder: q('pig', 'shoulder'),
  kangaroo_rump: <Steak bone />,
  emu_steak: <Steak />,
  duck_legs_game: <Drumstick />,
  rabbit_whole: <Rabbit />,
  pheasant_whole: <Bird kind="pheasant" />,
  // poultry
  whole_chicken: <Bird />,
  chicken_thighs: <Drumstick />,
  spatchcock_chicken: <Spatchcock />,
  duck_breast: <Breast />,
  quail_whole: <Bird kind="quail" scale={0.75} />,
  turkey_crown: <Breast big />,
  whole_turkey: <Bird kind="turkey" />,
  whole_duck: <Bird kind="duck" />,
  cornish_hen: <Bird scale={0.8} />,
  chicken_wings: <Wings />,
  // fish
  salmon_fillet: <Fillet />,
  whole_trout: <WholeFish />,
  mackerel_fillet: <Fillet />,
  swordfish_steak: <FishSteak />,
  tuna_steak: <FishSteak />,
  whole_snapper: <WholeFish />,
  prawns: <Prawn />,
  barramundi_fillet: <Fillet />,
  ocean_trout_fillet: <Fillet />,
  lobster_tail: <Lobster />,
  scallops: <Scallop />,
  king_prawns_shell: <Prawn big />,
  whole_barramundi: <WholeFish />,
  // veg
  corn_on_cob: <Corn />,
  bell_peppers: <Pepper />,
  eggplant: <Eggplant />,
  zucchini: <Zucchini />,
  portobello_mushrooms: <Mushroom />,
  whole_garlic: <Garlic />,
  cauliflower: <Cauliflower />,
  beetroot: <Beetroot />,
  sweet_potato_whole: <SweetPotato />,
  asparagus: <Asparagus />,
  whole_onion: <Onion />,
  butternut_pumpkin: <Butternut />,
  tomatoes_whole: <Tomato />,
  broccolini: <Broccolini />,
  // jerky
  beef_jerky: <Jerky />,
  venison_jerky: <Jerky />,
  chicken_jerky: <Jerky />,
  salmon_jerky: <Jerky />,
  pork_jerky: <Jerky />,
};

export const CUT_ICON_IDS = Object.keys(CUTS);
export const methodIcon = (id: string): ReactNode => METHODS[id] ?? <Steak />;
export const categoryIcon = (id: string): ReactNode => CATEGORIES[id] ?? <Steak />;
export const cutIcon = (id: string): ReactNode => CUTS[id] ?? <Steak />;
