import { Toast, type ToastType } from '../ui/Toast';

type MatrizToastProps = {
  message: string;
  type: ToastType;
  onClose?: () => void;
};

export function MatrizToast({ message, type, onClose }: MatrizToastProps) {
  return <Toast message={message} type={type} onClose={onClose} />;
}
