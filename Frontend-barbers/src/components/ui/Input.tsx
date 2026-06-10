import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, className = '', ...props }: Props) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <input id={inputId} className={`input-field ${className}`} {...props} />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
