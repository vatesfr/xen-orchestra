import { useI18n } from 'vue-i18n'

// The text of the mapping summary of a VM, worded alike in the selected VMs table and the review
export function useV2vMappingSummaryLabels() {
  const { t } = useI18n()

  // Whether the import resumes on a delta or creates a new VM is only known to the back end: the inventory and the
  // import VM do not name the source snapshot alike
  function getResumedParts(...details: string[]): string[] {
    return [t('v2v:resumes-from-last-sync'), ...details, t('v2v:mapping-locked')]
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
