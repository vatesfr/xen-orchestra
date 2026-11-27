import ApplianceHealthCheckCard from '@/modules/appliance/components/health-check/ApplianceHealthCheckCard.vue'
import { useXoaHealthCheck } from '@/modules/appliance/remote-resources/use-xoa-health-check.ts'
import type { ApplianceHealthCheckItem } from '@/modules/appliance/types/appliance-health-check.type.ts'
import { findCardTitleLabel } from '@/test/find-card-title.ts'
import { findStateHeroTypes } from '@/test/find-state-hero-types.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useCopyToClipboard } from '@core/composables/copy.composable.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { computed, ref } from 'vue'

const healthCheckResource = mockedExport(useXoaHealthCheck)

const copyToClipboard = mockedExport(useCopyToClipboard)

const healthCheckState = {
  healthCheckReport: ref<string>(),
  healthCheckItems: ref<ApplianceHealthCheckItem[]>([]),
  isHealthCheckReady: ref(true),
  hasHealthCheckError: ref(false),
}

const copy = vi.fn()

const copied = ref(false)

const isCopySupported = ref(true)

const REPORT = '✔ 1/3 - Internet connectivity\n⚠ 2/3 - Disk space: 85% used\n✖ 3/3 - NTP: not synchronized'

const ITEMS: ApplianceHealthCheckItem[] = [
  { name: 'NTP', status: 'danger', detail: 'not synchronized' },
  { name: 'Disk space', status: 'warning', detail: '85% used' },
  { name: 'Internet connectivity', status: 'success' },
]

beforeEach(() => {
  healthCheckState.healthCheckReport.value = undefined
  healthCheckState.healthCheckItems.value = []
  healthCheckState.isHealthCheckReady.value = true
  healthCheckState.hasHealthCheckError.value = false

  // What the remote resource derives from its items
  healthCheckResource.mockReturnValue({
    ...healthCheckState,
    healthCheckProblemCount: computed(
      () => healthCheckState.healthCheckItems.value.filter(item => item.status !== 'success').length
    ),
    hasHealthCheckFailure: computed(() =>
      healthCheckState.healthCheckItems.value.some(item => item.status === 'danger')
    ),
  })

  copy.mockReset()
  copied.value = false
  isCopySupported.value = true
  copyToClipboard.mockReturnValue({ copy, copied, isSupported: isCopySupported })
})

function setReport(items: ApplianceHealthCheckItem[] = ITEMS) {
  healthCheckState.healthCheckReport.value = REPORT
  healthCheckState.healthCheckItems.value = items
}

// The health check button runs its own job, covered by its own test
function mountCard() {
  return mount(ApplianceHealthCheckCard, {
    global: createGlobalTestConfig({ stubs: { ApplianceHealthCheckButton: true } }),
  })
}

function findItems(wrapper: VueWrapper) {
  return wrapper.findAll('.items .item').map(item => {
    const detail = item.find('.secondary')

    return {
      icon: item.getComponent(VtsIcon).props('name'),
      name: item.get('.typo-body-bold-small').text(),
      detail: detail.exists() ? detail.text() : undefined,
    }
  })
}

function getCopyButton(wrapper: VueWrapper) {
  return wrapper.getComponent(UiButton)
}

it('shows its title', () => {
  expect(findCardTitleLabel(mountCard())).toBe(t('appliance:health-check'))
})

describe('state', () => {
  it('tells the health check is unavailable when it cannot be fetched', () => {
    healthCheckState.hasHealthCheckError.value = true

    const wrapper = mountCard()

    expect(findStateHeroTypes(wrapper)).toEqual(['error'])
    expect(wrapper.text()).toContain(t('appliance:health-check-unavailable'))
  })

  it('shows it is loading while the health check is being fetched', () => {
    healthCheckState.isHealthCheckReady.value = false

    expect(findStateHeroTypes(mountCard())).toEqual(['busy'])
  })

  it('tells no health check has run yet', () => {
    const wrapper = mountCard()

    expect(findStateHeroTypes(wrapper)).toEqual([])
    expect(wrapper.get('.empty').text()).toContain(t('appliance:no-health-check-yet'))
  })

  it('lists each check with the icon of its status and its detail', () => {
    setReport()

    expect(findItems(mountCard())).toEqual([
      { icon: 'status:danger-circle', name: 'NTP', detail: 'not synchronized' },
      { icon: 'status:warning-circle', name: 'Disk space', detail: '85% used' },
      { icon: 'status:success-circle', name: 'Internet connectivity', detail: undefined },
    ])
  })
})

describe('problem counter', () => {
  it('shows no counter without problem', () => {
    setReport([{ name: 'Internet connectivity', status: 'success' }])

    expect(mountCard().findComponent(UiCounter).exists()).toBe(false)
  })

  it('counts the problems, in danger when a check fails', () => {
    setReport()

    const counter = mountCard().getComponent(UiCounter)

    expect(counter.props('value')).toBe(2)
    expect(counter.props('accent')).toBe('danger')
  })

  it('counts the problems, in warning when no check fails', () => {
    setReport([
      { name: 'Disk space', status: 'warning' },
      { name: 'Internet connectivity', status: 'success' },
    ])

    const counter = mountCard().getComponent(UiCounter)

    expect(counter.props('value')).toBe(1)
    expect(counter.props('accent')).toBe('warning')
  })
})

describe('copy', () => {
  it('offers no copy without report', () => {
    expect(mountCard().findComponent(UiButton).exists()).toBe(false)
  })

  it('offers to copy the report', () => {
    setReport()

    const button = getCopyButton(mountCard())

    expect(button.text()).toBe(t('action:copy-report'))
    expect(button.props('leftIcon')).toBe('fa:copy')
    expect(button.props('disabled')).toBe(false)
  })

  it('copies the report when clicking the button', async () => {
    setReport()

    await getCopyButton(mountCard()).trigger('click')

    expect(copy).toHaveBeenCalledOnce()
  })

  it('copies the report itself', () => {
    setReport()
    mountCard()

    const [source] = copyToClipboard.mock.lastCall as [() => string]

    expect(source()).toBe(REPORT)
  })

  it('tells once the report is copied', () => {
    setReport()
    copied.value = true

    const button = getCopyButton(mountCard())

    expect(button.text()).toBe(t('copied'))
    expect(button.props('leftIcon')).toBe('fa:check-circle')
  })

  it('disables the copy when the browser does not support it', () => {
    setReport()
    isCopySupported.value = false

    expect(getCopyButton(mountCard()).props('disabled')).toBe(true)
  })
})
