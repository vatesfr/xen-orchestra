import { useXoBackupRepositoryBenchmark } from '@/modules/backup/composables/use-xo-backup-repository-benchmark.composable.ts'
import type { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { createBrBenchmark } from '@/test/create-br-benchmark.ts'
import { createBr } from '@/test/create-br.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { formatSpeed } from '@core/utils/speed.util.ts'
import { nextTick, ref } from 'vue'

const { useBenchmarkJob, run } = vi.hoisted(() => ({
  useBenchmarkJob: vi.fn(),
  run: vi.fn(),
}))

// The job monitors a task through a remote-resource collection, which would open an SSE subscription
vi.mock(import('@/modules/backup/jobs/xo-backup-repository-benchmark.job.ts'), () => ({
  useXoBackupRepositoryBenchmarkJob: useBenchmarkJob as unknown as typeof useXoBackupRepositoryBenchmarkJob,
}))

beforeEach(() => {
  vi.restoreAllMocks()
  useBenchmarkJob.mockReset()
  run.mockReset()

  useBenchmarkJob.mockReturnValue({
    run,
    canRun: ref(true),
    isRunning: ref(false),
    errorMessage: ref(undefined),
  })
})

function mountBenchmark(br: FrontXoBackupRepository = createBr()) {
  return mountComposable(() => useXoBackupRepositoryBenchmark(br)).wrapper.vm
}

describe('benchmark', () => {
  it('is undefined when the repository was never benchmarked', () => {
    expect(mountBenchmark(createBr({ benchmarks: [] })).benchmark).toBeUndefined()
  })

  it('is the latest benchmark stored on the repository', () => {
    const latest = createBrBenchmark({ writeRate: 100_000_000, readRate: 200_000_000 })
    const result = mountBenchmark(
      createBr({ benchmarks: [createBrBenchmark({ writeRate: 1_000_000, readRate: 2_000_000 }), latest] })
    )

    expect(result.benchmark).toEqual(latest)
  })

  it('is replaced by the result of a benchmark run', async () => {
    run.mockResolvedValue({ writeRate: 300_000_000, readRate: 400_000_000 })
    const result = mountBenchmark(createBr({ benchmarks: [createBrBenchmark()] }))

    await result.runBenchmark()

    expect(result.benchmark).toEqual({ writeRate: 300_000_000, readRate: 400_000_000 })
  })

  it('stays unchanged when the benchmark run fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    run.mockRejectedValue(new Error('Backup repository unreachable'))
    const stored = createBrBenchmark()
    const result = mountBenchmark(createBr({ benchmarks: [stored] }))

    await result.runBenchmark()

    expect(result.benchmark).toEqual(stored)
  })

  it('drops the result of a benchmark run when the source repository changes', async () => {
    run.mockResolvedValue({ writeRate: 300_000_000, readRate: 400_000_000 })
    const br = ref(createBr({ benchmarks: [createBrBenchmark()] }))
    const { wrapper } = mountComposable(() => useXoBackupRepositoryBenchmark(br))

    await wrapper.vm.runBenchmark()

    const otherStored = createBrBenchmark({ writeRate: 5_000_000, readRate: 6_000_000 })
    br.value = createBr({ id: 'backup-repository-456' as FrontXoBackupRepository['id'], benchmarks: [otherStored] })
    await nextTick()

    expect(wrapper.vm.benchmark).toEqual(otherStored)
  })
})

describe('writeSpeed and readSpeed', () => {
  it('are undefined when the repository was never benchmarked', () => {
    const result = mountBenchmark(createBr({ benchmarks: [] }))

    expect({ write: result.writeSpeed, read: result.readSpeed }).toEqual({ write: undefined, read: undefined })
  })

  it('are the formatted rates of the latest stored benchmark', () => {
    const result = mountBenchmark(
      createBr({
        benchmarks: [
          createBrBenchmark({ writeRate: 1_000_000, readRate: 2_000_000 }),
          createBrBenchmark({ writeRate: 100_000_000, readRate: 200_000_000 }),
        ],
      })
    )

    expect({ write: result.writeSpeed, read: result.readSpeed }).toEqual({
      write: formatSpeed(100_000_000),
      read: formatSpeed(200_000_000),
    })
  })

  it('are the formatted rates of a benchmark run', async () => {
    run.mockResolvedValue({ writeRate: 300_000_000, readRate: 400_000_000 })
    const result = mountBenchmark(createBr({ benchmarks: [createBrBenchmark()] }))

    await result.runBenchmark()

    expect({ write: result.writeSpeed, read: result.readSpeed }).toEqual({
      write: formatSpeed(300_000_000),
      read: formatSpeed(400_000_000),
    })
  })
})
