import V2vVmsFilterHeader from '@/modules/v2v/components/vms/V2vVmsFilterHeader.vue'
import type { V2vDatastoreSummary } from '@/modules/v2v/composables/use-v2v-vms-step.composable.ts'
import { findCardTitleLabel } from '@/test/find-card-title.ts'
import { findParts } from '@/test/find-parts.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import { mount } from '@vue/test-utils'

const SOURCE_HOST = 'vcenter-prod.lab.local'

const DATASTORE_SUMMARY: V2vDatastoreSummary = {
  chipLabel: 'datastore:ds-b',
  summaryLabels: ['5 VMs', '4 not migrated'],
}

function mountHeader(props: { sourceHost?: string; datastoreSummary?: V2vDatastoreSummary } = {}) {
  return mount(V2vVmsFilterHeader, { props: { sourceHost: SOURCE_HOST, ...props }, global: createGlobalTestConfig() })
}

// Each title describes its VMs with one `InlineParts`
function findDescriptionParts(wrapper: ReturnType<typeof mountHeader>) {
  return findParts(wrapper, '.inline-parts')
}

function mountDatastoreHeader() {
  return mountHeader({ datastoreSummary: DATASTORE_SUMMARY })
}

describe('all VMs', () => {
  it('titles all the VMs', () => {
    expect(findCardTitleLabel(mountHeader())).toBe(t('all-vms'))
  })

  it('names the source and explains how to filter', () => {
    expect(findDescriptionParts(mountHeader())).toEqual([SOURCE_HOST, t('v2v:filter-vms-info')])
  })

  it('only explains how to filter without source host', () => {
    expect(findDescriptionParts(mountHeader({ sourceHost: undefined }))).toEqual([t('v2v:filter-vms-info')])
  })

  it('offers neither the datastore chip nor to clear the filter', () => {
    const wrapper = mountHeader()

    expect(wrapper.findComponent(UiChip).exists()).toBe(false)
    expect(wrapper.text()).not.toContain(t('action:clear-filter'))
  })
})

describe('datastore', () => {
  it('titles all the VMs with the datastore filter', () => {
    const wrapper = mountDatastoreHeader()

    expect(findCardTitleLabel(wrapper)).toContain(t('all-vms'))
    expect(wrapper.getComponent(UiChip).text()).toBe(DATASTORE_SUMMARY.chipLabel)
  })

  it('removes the datastore filter from its chip', async () => {
    const wrapper = mountDatastoreHeader()

    await wrapper.getComponent(UiChip).get('button').trigger('click')

    expect(wrapper.emitted('removeDatastore')).toEqual([[]])
  })

  it('summarizes the VMs of the datastore', () => {
    expect(findDescriptionParts(mountDatastoreHeader())).toEqual(DATASTORE_SUMMARY.summaryLabels)
  })

  it('clears the filter', async () => {
    const wrapper = mountDatastoreHeader()

    await getButton(wrapper, t('action:clear-filter')).trigger('click')

    expect(wrapper.emitted('clearFilter')).toEqual([[]])
  })

  it('does not explain how to filter', () => {
    expect(mountDatastoreHeader().text()).not.toContain(t('v2v:filter-vms-info'))
  })
})
