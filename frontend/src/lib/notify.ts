// Unified notification helpers using sonner with a compact card style
import { toast } from 'sonner'

function toMessage(input: any): string {
  if (typeof input === 'string') return input
  const d = input?.response?.data?.detail ?? input?.detail ?? input?.message ?? input
  if (typeof d === 'string') return d
  if (Array.isArray(d)) {
    // FastAPI/Pydantic error array
    const parts = d.map((e: any) => e?.msg || e?.message || JSON.stringify(e))
    return parts.join('; ')
  }
  try { return JSON.stringify(d) } catch { return String(d) }
}

const base = {
  className: 'edrop-toast-card',
  duration: 3500,
}

export function success(message: any) {
  toast.success(toMessage(message), base as any)
}

export function error(message: any) {
  toast.error(toMessage(message), base as any)
}

export function info(message: any) {
  toast(toMessage(message), base as any)
}

export function warn(message: any) {
  // sonner v1 may not expose warning; fallback to neutral with style
  const msg = toMessage(message)
  ;(toast as any).warning ? (toast as any).warning(msg, base) : toast(msg, { ...base, className: base.className + ' warn' })
}

export function show(message: any, options?: any) {
  toast(toMessage(message), { ...(base as any), ...(options || {}) })
}

export function dismiss() {
  toast.dismiss()
}

export default { success, error, info, warn, show, dismiss }
