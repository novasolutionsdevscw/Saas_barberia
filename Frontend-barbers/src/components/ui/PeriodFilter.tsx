import { lastDaysRange, monthRange } from '../../utils/format';

export type PeriodPreset = 'mes_actual' | 'mes_anterior' | 'ultimos_30' | 'personalizado';

export type PeriodValue = {
  preset: PeriodPreset;
  desde: string;
  hasta: string;
};

type Props = {
  value: PeriodValue;
  onChange: (v: PeriodValue) => void;
};

export function presetToRange(preset: PeriodPreset): { desde: string; hasta: string } {
  switch (preset) {
    case 'mes_anterior':
      return monthRange(-1);
    case 'ultimos_30':
      return lastDaysRange(30);
    case 'mes_actual':
    default:
      return monthRange(0);
  }
}

export function PeriodFilter({ value, onChange }: Props) {
  const setPreset = (preset: PeriodPreset) => {
    if (preset === 'personalizado') {
      onChange({ ...value, preset });
      return;
    }
    const r = presetToRange(preset);
    onChange({ preset, desde: r.desde, hasta: r.hasta });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['mes_actual', 'Este mes'],
            ['mes_anterior', 'Mes anterior'],
            ['ultimos_30', '30 días'],
            ['personalizado', 'Personalizado'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPreset(key)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              value.preset === key
                ? 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {value.preset === 'personalizado' && (
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={value.desde}
            onChange={(e) => onChange({ ...value, desde: e.target.value })}
            className="input-field text-sm"
            aria-label="Desde"
          />
          <input
            type="date"
            value={value.hasta}
            onChange={(e) => onChange({ ...value, hasta: e.target.value })}
            className="input-field text-sm"
            aria-label="Hasta"
          />
        </div>
      )}
    </div>
  );
}
