'use client';

import * as React from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
}

type Listener = (toasts: ToastMessage[]) => void;

let toasts: ToastMessage[] = [];
const listeners: Set<Listener> = new Set();

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

export function toast(message: Omit<ToastMessage, 'id'>) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, ...message }];
  emit();
  window.setTimeout(() => dismissToast(id), 6000);
  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToast() {
  const [state, setState] = React.useState<ToastMessage[]>(toasts);

  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return { toasts: state, toast, dismiss: dismissToast };
}
