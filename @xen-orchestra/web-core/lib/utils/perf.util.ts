// Lightweight User Timing helpers used to benchmark the data layer.
// Everything is a no-op unless the app is started with `VITE_XO_PERF=1`, so there is
// no runtime cost in production and the instrumentation can stay in the code.

const PERF_ENABLED = import.meta.env.VITE_XO_PERF === '1'

const PERF_PREFIX = 'xo-perf:'

export function isPerfEnabled() {
  return PERF_ENABLED
}

export function perfStart(label: string) {
  if (!PERF_ENABLED) {
    return
  }

  performance.mark(`${PERF_PREFIX}${label}:start`)
}

export function perfEnd(label: string) {
  if (!PERF_ENABLED) {
    return
  }

  const startMark = `${PERF_PREFIX}${label}:start`

  try {
    performance.measure(`${PERF_PREFIX}${label}`, startMark)
  } catch {
    // The matching start mark may have been cleared between two runs; ignore this sample.
  }

  performance.clearMarks(startMark)
}
