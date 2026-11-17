import { useV2vMappingLabels } from '@/modules/v2v/composables/use-v2v-mapping-labels.composable.ts'
import type { V2vNextTransfer } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// The text of the mapping summary of a VM, worded alike in the selected VMs table and the review
export function useV2vMappingSummaryLabels() {
  const { t } = useI18n()

  const { nextTransferLabels } = useV2vMappingLabels()

  const resumedTransferLabels = computed<Record<V2vNextTransfer, string>>(() => ({
    delta: t('v2v:delta-from-last-sync'),
    full: nextTransferLabels.value.full,
  }))

  // A resumed VM: its transfer, then where it goes, then its kept mapping
  function getResumedParts(transfer: V2vNextTransfer, ...details: string[]): string[] {
    return [resumedTransferLabels.value[transfer], ...details, t('v2v:mapping-locked')]
  }

  function withTargets(countLabel: string, targets: string[] | undefined): string {
    return targets === undefined
      ? countLabel
      : t('source-to-destination', { source: countLabel, destination: targets.join(', ') })
  }

  return {
    getResumedParts,
    withTargets,
  }
}
