export default function ProgressBar({ current }: { current: number }) {
  const labels = ['Category', 'Method', 'Cut', 'Weight'];

  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const stepNum = i + 1;
        const isDone   = stepNum < current;
        const isActive = stepNum === current;
        return (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isDone   ? 'bg-brand-primary text-white' :
                isActive ? 'bg-brand-primary/20 border-2 border-brand-primary text-brand-primary' :
                           'bg-brand-surface border-2 border-brand-muted/20 text-brand-muted'
              }`}>
                {isDone ? '✓' : stepNum}
              </div>
              <span className={`text-xs hidden sm:block ${isActive ? 'text-brand-text font-medium' : 'text-brand-muted'}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 transition-colors ${isDone ? 'bg-brand-primary' : 'bg-brand-muted/20'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
