/**
 * Event-loop-utilization (ELU) and CPU self-monitoring for the parent process.
 *
 * Owns the sampling state previously held inline on `OpenMetricsPlugin`
 * (`#eluSamples`, `#lastEluSnapshot`, `#lastCpuUsage`, `#eluSamplerInterval`).
 * `start()`/`stop()` manage the 1 s sampling interval; `drainSamples()` and
 * `cpuDelta()` are consumed by `getXoMetrics` to fold the samples into the
 * `nodeProcess` block of a scrape.
 */

import { performance } from 'node:perf_hooks'

/** Maximum number of ELU samples retained (one per second → 60 s window). */
const MAX_SAMPLE = 60

export class EluSampler {
  // ELU sampling state
  #eluSamples: number[] = []
  #lastEluSnapshot = performance.eventLoopUtilization()
  #lastCpuUsage = process.cpuUsage()
  #eluSamplerInterval: ReturnType<typeof setInterval> | undefined

  start(): void {
    this.#lastEluSnapshot = performance.eventLoopUtilization()
    this.#lastCpuUsage = process.cpuUsage()
    this.#eluSamples = []
    this.#eluSamplerInterval = setInterval(() => {
      const curr = performance.eventLoopUtilization()
      const delta = performance.eventLoopUtilization(curr, this.#lastEluSnapshot)
      this.#lastEluSnapshot = curr
      this.#eluSamples.push(delta.utilization)
      // ensure the sample size is bound
      while (this.#eluSamples.length > MAX_SAMPLE) {
        this.#eluSamples.shift()
      }
    }, 1000)
    this.#eluSamplerInterval.unref()
  }

  stop(): void {
    if (this.#eluSamplerInterval !== undefined) {
      clearInterval(this.#eluSamplerInterval)
      this.#eluSamplerInterval = undefined
    }
  }

  /**
   * Return the accumulated samples and reset the buffer, mirroring the
   * `const samples = this.#eluSamples; this.#eluSamples = []` drain that lived
   * inline in `#getXoMetrics`.
   */
  drainSamples(): number[] {
    const samples = this.#eluSamples
    this.#eluSamples = []
    return samples
  }

  /**
   * Return the CPU usage delta since the previous call and reset the baseline,
   * mirroring the `process.cpuUsage(this.#lastCpuUsage)` /
   * `this.#lastCpuUsage = process.cpuUsage()` pair from `#getXoMetrics`.
   */
  cpuDelta(): ReturnType<typeof process.cpuUsage> {
    const cpuDelta = process.cpuUsage(this.#lastCpuUsage)
    this.#lastCpuUsage = process.cpuUsage()
    return cpuDelta
  }
}
