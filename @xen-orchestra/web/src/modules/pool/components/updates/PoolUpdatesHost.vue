<template>
  <div class="pool-updates-host">
    <div class="host">
      <VtsObjectIcon type="host" size="medium" />
      <UiLink :to="{ name: '/host/[id]/dashboard', params: { id: hostId } }" size="medium">
        {{ getHostById(hostId as never)?.name_label ?? hostId }}
      </UiLink>
      <UiTag :accent="HOST_ACCENTS[host.status]" variant="secondary">
        {{ t(`rolling-update:host-status:${host.status}`) }}
      </UiTag>
    </div>
    <ul class="steps">
      <li v-for="step in steps" :key="step.id" class="step">
        <UiLoader v-if="step.status === 'running'" class="loader" />
        <UiInfo :accent="STEP_ACCENTS[step.status]">
          {{ t(`rolling-update:step:${kebabCase(step.runningStep ?? step.id)}`) }}
        </UiInfo>
      </li>
    </ul>
    <UiLogEntryViewer
      v-if="host.lastError !== null"
      :content="host.lastError"
      :label="t('error')"
      size="small"
      accent="danger"
    />
  </div>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getRollingUpdateStepColumns } from '@/modules/pool/utils/rolling-update.util.ts'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import type { PoolRollingUpdateRecoveryHost, PoolRollingUpdateRecoveryStep } from '@vates/types'
import { kebabCase } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  hostId: string
  host: PoolRollingUpdateRecoveryHost
}>()

const HOST_ACCENTS: Record<PoolRollingUpdateRecoveryHost['status'], TagAccent> = {
  pending: 'muted',
  running: 'info',
  interrupted: 'warning',
  succeeded: 'success',
  failed: 'danger',
  'not-needed': 'neutral',
}

const STEP_ACCENTS: Record<PoolRollingUpdateRecoveryStep['status'], InfoAccent> = {
  pending: 'muted',
  running: 'info',
  'observed-succeeded': 'success',
  failed: 'danger',
  'not-needed': 'muted',
}

const { t } = useI18n()

const { getHostById } = useXoHostCollection()

const steps = computed(() => getRollingUpdateStepColumns(host))
</script>

<style lang="postcss" scoped>
.pool-updates-host {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .host,
  .steps,
  .step {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .steps {
    flex-wrap: wrap;
    gap: 2.4rem;
  }

  .loader {
    width: 1.6rem;
    height: 1.6rem;
  }
}
</style>
