type SectionHeaderProps = {
  kicker: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
};

export function SectionHeader({
  kicker,
  title,
  description,
  align = 'center',
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div className={`mb-10 max-w-2xl sm:mb-14 ${alignClass}`}>
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--landing-primary)]/25 bg-[var(--landing-primary-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--landing-primary)] sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.2em]">
        {kicker}
      </span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:mt-5 sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:mt-4 sm:text-base md:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
