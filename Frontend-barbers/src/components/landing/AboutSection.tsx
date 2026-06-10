import type { LandingConfig } from '../../services/api';
import { SectionHeader } from './SectionHeader';

type AboutSectionProps = {
  landing: LandingConfig;
};

export function AboutSection({ landing }: AboutSectionProps) {
  if (!landing.descripcion?.trim()) return null;

  return (
    <section id="nosotros" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          kicker="Nosotros"
          title="Experiencia y estilo en cada visita"
          description={landing.descripcion}
        />
      </div>
    </section>
  );
}
