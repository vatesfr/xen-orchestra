import { useXoBackupRepositoryBenchmark } from '@/modules/backup-repository/composables/use-xo-backup-repository-benchmark.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBrBenchmark } from '@/test/create-br-benchmark.ts'
import { createBr } from '@/test/create-br.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { formatSpeed } from '@core/utils/speed.util.ts'
import { ref } from 'vue'

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

  it('follows the changes of the source repository', () => {
    const br = ref(createBr({ benchmarks: [createBrBenchmark()] }))
    const { wrapper } = mountComposable(() => useXoBackupRepositoryBenchmark(br))

    const latest = createBrBenchmark({ writeRate: 300_000_000, readRate: 400_000_000 })
    br.value = createBr({ benchmarks: [createBrBenchmark(), latest] })

    expect(wrapper.vm.benchmark).toEqual(latest)
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
})
