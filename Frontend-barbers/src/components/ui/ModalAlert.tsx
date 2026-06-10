type ModalAlertProps = {
  message: string;
  type: 'success' | 'error';
};

export function ModalAlert({ message, type }: ModalAlertProps) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        type === 'success'
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          : 'border-red-500/30 bg-red-500/10 text-red-200'
      }`}
      role="status"
    >
      {message}
    </div>
  );
}
