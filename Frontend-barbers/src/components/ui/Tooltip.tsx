import type { ReactNode } from 'react';

type TooltipProps = {
  label: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
};

export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  const position =
    side === 'top'
      ? 'bottom-full left-1/2 mb-2 -translate-x-1/2'
      : 'top-full left-1/2 mt-2 -translate-x-1/2';

  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-[120] whitespace-nowrap rounded-lg border border-violet-500/30 bg-[#1a1628] px-2.5 py-1.5 text-xs font-medium text-violet-100 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 ${position}`}
      >
        {label}
        <span
          className={`absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border border-violet-500/30 bg-[#1a1628] ${
            side === 'top' ? 'top-full -mt-1 border-t-0 border-l-0' : 'bottom-full -mb-1 border-b-0 border-r-0'
          }`}
        />
      </span>
    </span>
  );
}
