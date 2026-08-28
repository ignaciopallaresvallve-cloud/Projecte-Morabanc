"use client";

export type ToastVariant = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

const TOAST_DURATION_MS = 4000;

const EMPTY_TOASTS: ToastMessage[] = [];

let toasts: ToastMessage[] = EMPTY_TOASTS;
let listeners: Array<() => void> = [];

function emit() {
  listeners.forEach((listener) => listener());
}

/** Muestra un toast (confirmación/aviso) durante unos segundos. Solo cliente. */
export function toast(message: string, variant: ToastVariant = "success") {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, message, variant }];
  emit();

  setTimeout(() => {
    const next = toasts.filter((item) => item.id !== id);
    toasts = next.length === 0 ? EMPTY_TOASTS : next;
    emit();
  }, TOAST_DURATION_MS);
}

export function subscribeToasts(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
}

export function getToastsSnapshot() {
  return toasts;
}

export function getToastsServerSnapshot(): ToastMessage[] {
  return EMPTY_TOASTS;
}
