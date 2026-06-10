import type { CSSProperties, ReactNode } from 'react';
import type { LandingConfig } from '../../services/api';

type LandingThemeProps = {
  landing: LandingConfig;
  children: ReactNode;
};

export function LandingTheme({ landing, children }: LandingThemeProps) {
  const style = {
    '--landing-primary': landing.color_principal,
    '--landing-secondary': landing.color_secundario,
    '--landing-primary-soft': `${landing.color_principal}33`,
    '--landing-primary-glow': `${landing.color_principal}66`,
  } as CSSProperties;

  return (
    <div
      className="landing-theme min-h-dvh overflow-x-hidden bg-[#0a0c10] text-slate-100"
      style={style}
    >
      {children}
    </div>
  );
}
