import ClusterStatusCard from '@/modules/kubernetes/components/list/panel/card/ClusterStatusCard.vue'
import { createKubernetesCluster } from '@/test/create-kubernetes-cluster.ts'
import { findCardLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { mount } from '@vue/test-utils'

function mountClusterStatusCard(isReconciliationPaused: boolean) {
  return mount(ClusterStatusCard, {
    props: {
      cluster: createKubernetesCluster({ is_reconciliation_paused: isReconciliationPaused }),
    },
    global: createGlobalTestConfig(),
  })
}

function pausedRowInfo(wrapper: ReturnType<typeof mountClusterStatusCard>) {
  const row = wrapper.findAll('.vts-card-row-key-value').find(cardRow => cardRow.get('.key').text() === t('paused'))

  if (row === undefined) {
    throw new Error('Paused row not found')
  }

  return row.getComponent(UiInfo)
}

it('shows paused when cluster reconciliation is paused', () => {
  const wrapper = mountClusterStatusCard(true)

  expect(findCardLabelledValues(wrapper)[t('paused')]).toBe(t('paused'))
  expect(pausedRowInfo(wrapper).props('accent')).toBe('warning')
})

it('shows no when cluster reconciliation is not paused', () => {
  const wrapper = mountClusterStatusCard(false)

  expect(findCardLabelledValues(wrapper)[t('paused')]).toBe(t('no'))
  expect(pausedRowInfo(wrapper).props('accent')).toBe('muted')
})
