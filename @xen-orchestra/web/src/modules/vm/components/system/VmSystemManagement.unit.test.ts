import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VmSystemManagement from '@/modules/vm/components/system/VmSystemManagement.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { itRendersCardTitle } from '@/test/card-title.ts'
import { createHost } from '@/test/create-host.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { findTitleLabel } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { VM_OPERATIONS } from '@vates/types'
import { mount } from '@vue/test-utils'

mockXoCollections('host')

beforeEach(() => {
  xoCollectionsMock.reset()
})

function mountManagement(vm: FrontXoVm = createVm()) {
  return mount(VmSystemManagement, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

itRendersCardTitle(mountManagement, t('vm-management'), findTitleLabel)

const VM_SETTING_CASES: [name: string, vm: Partial<FrontXoVm>, values: Record<string, string>, seed?: () => void][] = [
  [
    'shows high availability as enabled when the VM has a restart priority',
    { high_availability: 'restart' },
    { [t('high-availability')]: t('enabled') },
  ],
  [
    'shows high availability as disabled when the VM has no restart priority',
    { high_availability: '' },
    { [t('high-availability')]: t('disabled') },
  ],
  [
    'shows the name of the affinity host',
    { affinityHost: 'host-1' as FrontXoHost['id'] },
    { [t('affinity-host')]: 'Primary Host' },
    () => {
      xoCollectionsMock.hosts.value = [createHost({ id: 'host-1' as FrontXoHost['id'], name_label: 'Primary Host' })]
    },
  ],
  [
    'falls back to "None" when the VM has no affinity host',
    { affinityHost: undefined },
    { [t('affinity-host')]: t('none') },
  ],
  [
    'shows the VM as protected from accidental deletion when destroy is blocked',
    { blockedOperations: { [VM_OPERATIONS.DESTROY]: 'true' } as FrontXoVm['blockedOperations'] },
    {
      [t('protect-from-accidental-deletion')]: t('enabled'),
      [t('protect-from-accidental-shutdown')]: t('disabled'),
    },
  ],
  [
    'shows the VM as protected from accidental shutdown when any shutdown operation is blocked',
    { blockedOperations: { [VM_OPERATIONS.HARD_SHUTDOWN]: 'true' } as FrontXoVm['blockedOperations'] },
    {
      [t('protect-from-accidental-deletion')]: t('disabled'),
      [t('protect-from-accidental-shutdown')]: t('enabled'),
    },
  ],
  [
    'shows both protections as disabled when no operation is blocked',
    { blockedOperations: {} as FrontXoVm['blockedOperations'] },
    {
      [t('protect-from-accidental-deletion')]: t('disabled'),
      [t('protect-from-accidental-shutdown')]: t('disabled'),
    },
  ],
  [
    'shows whether the VM starts automatically with its pool',
    { auto_poweron: true },
    { [t('auto-power')]: t('enabled') },
  ],
]

it.each(VM_SETTING_CASES)('%s', (_, vm, values, seed) => {
  seed?.()

  const wrapper = mountManagement(createVm(vm))

  expect(findLabelledValues(wrapper)).toMatchObject(values)
})

describe('start delay', () => {
  function mountStartDelay(startDelay: number) {
    return findLabelledValues(mountManagement(createVm({ startDelay })))[t('start-delay')]
  }

  it('spells out every non-zero unit of the delay', () => {
    expect(mountStartDelay(2 * 86_400 + 3 * 3_600 + 4 * 60 + 5)).toBe(
      `${t('relative-time:day', 2)} ${t('relative-time:hour', 3)} ${t('relative-time:minute', 4)} ${t('relative-time:second', 5)}`
    )
  })

  it('omits the units the delay does not reach', () => {
    expect(mountStartDelay(3_600 + 30)).toBe(`${t('relative-time:hour', 1)} ${t('relative-time:second', 30)}`)
  })

  it('uses the singular wording for a delay of a single unit', () => {
    expect(mountStartDelay(86_400)).toBe(t('relative-time:day', 1))
  })

  it('falls back to zero seconds when the VM has no start delay', () => {
    expect(mountStartDelay(0)).toBe(t('relative-time:second', 0))
  })
})
