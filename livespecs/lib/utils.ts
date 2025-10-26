import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function withPerf<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    return await fn()
  } finally {
    const duration = Math.round(performance.now() - start)
    if (process.env.NODE_ENV === "development") {
      const msg = `[perf] ${label}: ${duration}ms`
      if (duration > 250) {
        console.warn(msg)
      } else {
        console.log(msg)
      }
    }
  }
}
