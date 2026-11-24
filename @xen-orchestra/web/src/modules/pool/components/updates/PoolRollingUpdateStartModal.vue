<template>
  <UiModal accent="info" @confirm="emit('confirm', { ...options })" @dismiss="emit('cancel')">
    <template #title>
      {{ t('rolling-update:start-title') }}
    </template>

    <template #content>
      <div class="content">
        <UiInfo accent="info" wrap>{{ t('rolling-update:start-message') }}</UiInfo>
        <UiCheckbox v-for="option in offeredOptions" :key="option" v-model="options[option]" accent="brand">
          {{ t(`rolling-update:option:${kebabCase(option)}`) }}
        </UiCheckbox>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('cancel') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton :disabled="isBlocked">
        {{ t('action:start') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import {
  getOfferedStartOptions,
  isRollingUpdateStartBlocked,
  type RollingUpdateStartOptions,
} from '@/modules/pool/utils/rolling-update.util.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import type { PoolRollingUpdatePrecheck } from '@vates/types'
import { kebabCase } from 'lodash-es'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

const { checks } = defineProps<{
  checks: PoolRollingUpdatePrecheck[]
}>()

const emit = defineEmits<{
  confirm: [options: RollingUpdateStartOptions]
  cancel: []
}>()

const { t } = useI18n()

const options = reactive<RollingUpdateStartOptions>({})

const offeredOptions = computed(() => getOfferedStartOptions(checks))

const isBlocked = computed(() => isRollingUpdateStartBlocked(checks, options))
</script>

<style lang="postcss" scoped>
.content {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
