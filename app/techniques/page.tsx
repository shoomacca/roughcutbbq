import Footer from "@/components/Footer";
import meatsData from "@/data/meats.json";
import type { MeatCategory, Cut } from "@/types/calculator";

const categories = meatsData as unknown as MeatCategory[];

export default function TechniquesPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0A150D' }}>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-16 relative">
        <div
          className="absolute inset-x-0 top-0 h-[500px] z-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(90,155,106,0.1) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center mb-16">
          <div className="w-16 h-1 bg-[#5A9B6A] rounded-full mb-6" />
          <h1 className="text-5xl md:text-7xl font-bold text-[#FAF6E9] mb-6 tracking-tight" style={{ fontFamily: 'var(--font-display, Georgia, serif)', textShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
            Reference & Techniques
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl leading-relaxed">
            The ultimate guide to times, temperatures, and techniques for every cut.
          </p>
        </div>

        <div className="relative z-10 space-y-16">
          {categories.map((category) => (
            <section key={category.id} className="scroll-mt-24" id={category.id}>
              <h2 className="text-3xl font-bold text-[#FAF6E9] mb-8 border-b border-white/10 pb-4" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
                {category.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.cuts.map((cut: Cut) => (
                  <div 
                    key={cut.id} 
                    className="p-6 rounded-3xl flex flex-col transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#5A9B6A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <h3 className="text-xl font-bold text-[#FAF6E9] mb-1 relative z-10">{cut.name}</h3>
                    
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm relative z-10 flex-1">
                      <div>
                        <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold">Smoker Temp</p>
                        <p className="text-[#5A9B6A] font-semibold text-lg">{cut.applianceTempC?.smoker || '-'}°C</p>
                      </div>
                      <div>
                        <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold">Target Temp</p>
                        <p className="text-[#FAF6E9] font-semibold text-lg">{cut.internalTempC?.smoker || '-'}°C</p>
                      </div>
                      <div>
                        <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold">Time</p>
                        <p className="text-white/80">
                          {cut.timeMode?.smoker === 'per_kg' ? `${cut.hoursPerKg?.smoker} h/kg` : cut.timeMode?.smoker === 'flat' ? `${cut.flatCookHours?.smoker} h` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold">Rest</p>
                        <p className="text-white/80">{cut.restMinutes > 0 ? `${cut.restMinutes} min` : 'None'}</p>
                      </div>
                      {cut.hasStall?.smoker && (
                        <div>
                          <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold">Stall</p>
                          <p className="text-white/80">~{cut.stallTempC}°C</p>
                        </div>
                      )}
                      {cut.wrapTempC?.smoker && (
                        <div>
                          <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold">Wrap at</p>
                          <p className="text-white/80">{cut.wrapTempC.smoker}°C</p>
                        </div>
                      )}
                    </div>
                    
                    {cut.tips && cut.tips.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-white/5 relative z-10">
                        <p className="text-white/50 text-xs leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                          {cut.tips[0]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
