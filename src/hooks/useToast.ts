import { useState } from 'react';

export type Toast = {
  message: string;
  kind: 'success' | 'error';
};

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  function showToast(message: string, kind: Toast['kind'] = 'success') {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 2600);
  }

  return { toast, showToast };
}
