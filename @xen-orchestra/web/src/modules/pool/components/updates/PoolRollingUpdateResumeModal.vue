<template>
  <UiModal accent="info" @confirm="emit('confirm', options)" @dismiss="emit('cancel')">
    <template #title>
      {{ t('rolling-update:resume-title') }}
    </template>

    <template #content>
      <div class="content">
        <UiInfo accent="info" wrap>{{ t('rolling-update:resume-message') }}</UiInfo>
        <template v-if="operatorChanges.length > 0">
          <UiInfo v-for="change in operatorChanges" :key="getRollingUpdateItemKey(change)" accent="warning" wrap>
            {{ getRollingUpdateOperatorChangeLabel(t, change) }}
          </UiInfo>
          <UiCheckbox v-model="options.acceptOperatorChanges" accent="brand">
            {{ t('rolling-update:accept-operator-changes') }}
          </UiCheckbox>
        </template>
        <UiCheckbox v-if="canBypassBackupCheck" v-model="options.bypassBackupCheck" accent="brand">
          {{ t('rolling-update:resume-bypass-backup-check') }}
        </UiCheckbox>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('cancel') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton :disabled="operatorChanges.length > 0 && !options.acceptOperatorChanges">
        {{ t('action:resume') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoPoolRollingUpdatePrecheck } from '@/modules/pool/remote-resources/use-xo-pool-rolling-update-precheck.ts'
import {
  getOfferedStartOptions,
  getRollingUpdateItemKey,
  getRollingUpdateOperatorChangeLabel,
  type RollingUpdateResumeOptions,
} from '@/modules/pool/utils/rolling-update.util.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import type { PoolRollingUpdateRecoveryOperatorChange } from '@vates/types'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolId, operatorChanges } = defineProps<{
  poolId: FrontXoPool['id']
  operatorChanges: PoolRollingUpdateRecoveryOperatorChange[]
}>()

const emit = defineEmits<{
  confirm: [options: RollingUpdateResumeOptions]
  cancel: []
}>()

const { t } = useI18n()

const { checks } = useXoPoolRollingUpdatePrecheck({}, () => poolId)

const options = reactive<RollingUpdateResumeOptions>({})

// A resume refuses to run over backups like a start does, and takes the same option to go on anyway
const canBypassBackupCheck = computed(() => getOfferedStartOptions(checks.value).includes('bypassBackupCheck'))
</script>

<style lang="postcss" scoped>
.content {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
