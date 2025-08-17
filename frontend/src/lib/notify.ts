// Unified notification helpers using sonner with a compact card style
import { toast } from 'sonner'

const base = {
  className: 'edrop-toast-card',
  duration: 3500,
}

export function success(message: string) {
  toast.success(message, base as any)
}

export function error(message: string) {
  toast.error(message, base as any)
}

export function info(message: string) {
  toast(message, base as any)
}

export function warn(message: string) {
  // sonner v1 may not expose warning; fallback to neutral with style
  ;(toast as any).warning ? (toast as any).warning(message, base) : toast(message, { ...base, className: base.className + ' warn' })
}

export function show(message: string, options?: any) {
  toast(message, { ...(base as any), ...(options || {}) })
}

export function dismiss() {
  toast.dismiss()
}

export default { success, error, info, warn, show, dismiss }
