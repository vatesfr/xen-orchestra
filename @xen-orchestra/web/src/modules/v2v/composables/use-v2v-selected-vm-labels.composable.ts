import { useV2vVmLabels, type V2vAccentedLabel } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type {
  V2vMappingSummary,
  V2vReadinessLevel,
  V2vSelectedVmCheck,
  V2vSelectedVmKind,
} from '@/modules/v2v/types/v2v-selected-vm.type.ts'
import { V2V_READINESS_LEVELS } from '@/modules/v2v/utils/v2v-selected-vm.util.ts'
import { mapCountedKeys } from '@/shared/utils/count.util.ts'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const KIND_ACCENTS: Record<V2vSelectedVmKind, TagAccent> = {
  new: 'neutral',
  resume: 'info',
}

// Shared by the readiness tags and the check of each VM, so a level reads the same in both
const READINESS_ACCENTS: Record<V2vReadinessLevel, TagAccent & InfoAccent> = {
  ready: 'success',
  warning: 'warning',
  blocking: 'danger',
}

// The text of the selected VMs panel; an unsupported reason reads as in the table
export function useV2vSelectedVmLabels() {
  const { t } = useI18n()

  const { unsupportedReasonLabels } = useV2vVmLabels()

  const kindLabels = computed<Record<V2vSelectedVmKind, string>>(() => ({
    new: t('new'),
    resume: t('resume'),
  }))

  function getKindTag(kind: V2vSelectedVmKind): V2vAccentedLabel<TagAccent> {
    return { label: kindLabels.value[kind], accent: KIND_ACCENTS[kind] }
  }

  // A pool still loading is named by its id rather than not at all
  function getCheckLabel(check: V2vSelectedVmCheck, poolName: string | undefined): string {
    switch (check.type) {
      case 'not-found':
        return t('v2v:not-found-in-source')
      case 'unsupported':
        return unsupportedReasonLabels.value[check.reason]
      case 'running':
        return t('import-in-progress')
      case 'partial-on-other-pool':
        return t('v2v:partial-import-on-pool', { pool: poolName ?? check.poolId })
      case 'already-migrated':
        return t('v2v:already-migrated-confirm-at-launch')
      case 'ready':
        return t('ready')
    }
  }

  function getCheckInfo(check: V2vSelectedVmCheck, poolName?: string): V2vAccentedLabel<InfoAccent> {
    return { label: getCheckLabel(check, poolName), accent: READINESS_ACCENTS[check.level] }
  }

  function withTarget(countLabel: string, target: string | undefined): string {
    return target === undefined ? countLabel : t('source-to-destination', { source: countLabel, destination: target })
  }

  function getMappingParts(summary: V2vMappingSummary | undefined): string[] {
    if (summary === undefined) {
      return []
    }

    if (summary.type === 'locked') {
      return [t('v2v:delta-from-last-sync'), t('v2v:mapping-locked')]
    }

    const { diskCount, srName, nicCount, networkName } = summary

    return [
      ...(diskCount > 0 ? [withTarget(t('n-disks', { n: diskCount }), srName)] : []),
      ...(nicCount > 0 ? [withTarget(t('n-nics', { n: nicCount }), networkName)] : []),
    ]
  }

  const readinessCountLabelGetters: Record<V2vReadinessLevel, (count: number) => string> = {
    ready: count => t('n-ready', { n: count }),
    warning: count => t('n-warnings', { n: count }),
    blocking: count => t('n-blocking', { n: count }),
  }

  function getReadinessTags(counts: Record<V2vReadinessLevel, number>): V2vAccentedLabel<TagAccent>[] {
    return mapCountedKeys(V2V_READINESS_LEVELS, counts, (level, count) => ({
      label: readinessCountLabelGetters[level](count),
      accent: READINESS_ACCENTS[level],
    }))
  }

  return {
    getKindTag,
    getCheckInfo,
    getMappingParts,
    getReadinessTags,
  }
}
