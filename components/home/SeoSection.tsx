/* Server component — no 'use client' */

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Pick your cut',
    desc: 'Choose from beef, pork, poultry, seafood, or vegetables.',
  },
  {
    step: '2',
    title: 'Enter your weight',
    desc: 'We calculate cook time, rest time, and target temperatures automatically.',
  },
  {
    step: '3',
    title: 'Follow your plan',
    desc: 'Get a full cook timeline with milestones, temperatures, and a start-time calculator.',
  },
];

const VALUE_PROPS = [
  { icon: '🎯', label: 'Precision temperatures', desc: 'Per-cut internal temp targets based on real BBQ science.' },
  { icon: '⏱️', label: 'Cook time calculator', desc: 'Accurate time estimates for every weight, every method.' },
  { icon: '📋', label: 'Full cook timeline', desc: 'Step-by-step milestones so nothing gets missed.' },
  { icon: '📧', label: 'Email your plan', desc: 'Get the full plan delivered to your inbox, no account needed.' },
];

export default function SeoSection() {
  return (
    <section
      className="w-full bg-[#0d1208] border-t border-white/5 py-14 px-4"
      aria-label="About Rough Cut BBQ Cook Calculator"
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-12">

        {/* Intro */}
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-3">
            The free BBQ cook calculator for pitmasters
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-lg mx-auto">
            Rough Cut BBQ calculates exact cook times, rest periods, and internal temperatures
            for any cut — brisket, ribs, pulled pork, chicken, fish, and more.
            Whether you&apos;re smoking low and slow or grilling hot and fast, we&apos;ve got your plan.
          </p>
        </div>

        {/* How it works */}
        <div>
          <h3 className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-6 text-center">
            How it works
          </h3>
          <ol className="flex flex-col gap-4">
            {HOW_IT_WORKS.map((item) => (
              <li key={item.step} className="flex gap-4 items-start">
                <span
                  className="flex-none w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: '#f97316' }}
                >
                  {item.step}
                </span>
                <div>
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  <p className="text-white/50 text-sm mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Value props */}
        <div>
          <h3 className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-6 text-center">
            What you get
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VALUE_PROPS.map((vp) => (
              <div
                key={vp.label}
                className="rounded-xl border border-white/8 bg-white/3 px-4 py-4 flex gap-3 items-start"
              >
                <span className="text-xl flex-none">{vp.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{vp.label}</p>
                  <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{vp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cuts covered */}
        <div className="text-center">
          <h3 className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-4">
            Cuts covered
          </h3>
          <p className="text-white/50 text-sm leading-relaxed">
            Brisket · Pork shoulder · Baby back ribs · Spare ribs · Whole chicken ·
            Spatchcock chicken · Salmon · Whole fish · Rump tip · Pork belly ·
            Corn · Portobello mushrooms · and more
          </p>
        </div>

      </div>
    </section>
  );
}
