<template>
  <UiDrawer
    class="pool-live-vcpu-scaling-drawer"
    :on-dismiss="() => emit('cancel')"
    @dismiss="emit('cancel')"
    @confirm="onConfirm()"
  >
    <template #title>{{ t('live-vcpu-scaling') }}</template>

    <template #content>
      <div class="content">
        <p class="typo-body-regular-small">{{ t('live-vcpu-scaling:description') }}</p>

        <UiToggle v-model="enabled">{{ enabled ? t('enabled') : t('disabled') }}</UiToggle>

        <VtsInputWrapper v-if="enabled" :label="t('maximum-vcpu')" :message="messages" wrap-message>
          <UiInput v-model.number="max" type="number" accent="brand" />
        </VtsInputWrapper>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton :disabled="enabled && !isValid">
        {{ t('action:save') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import {
  DEFAULT_LIVE_VCPU_SCALING_MAX,
  isValidLiveVcpuScalingMax,
} from '@/modules/pool/utils/xo-pool-live-vcpu-scaling.util.ts'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { current, cap } = defineProps<{
  // current pool setting, undefined when off
  current: number | undefined
  // physical cores of the smallest host of the pool
  cap: number | undefined
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [value: number | null]
}>()

const { t } = useI18n()

const enabled = ref(current !== undefined)
const max = ref<number>(current ?? DEFAULT_LIVE_VCPU_SCALING_MAX)

const isValid = computed(() => isValidLiveVcpuScalingMax(max.value))

const messages = computed(() => {
  const list: (string | { content: string; accent: InfoAccent })[] = []

  if (!isValid.value) {
    list.push({ content: t('live-vcpu-scaling:invalid'), accent: 'danger' })
  } else if (cap !== undefined && max.value > cap) {
    list.push({ content: t('live-vcpu-scaling:capped', { n: cap }), accent: 'warning' })
  }

  list.push(t('live-vcpu-scaling:guests'), t('live-vcpu-scaling:memory'))

  return list
})

function onConfirm() {
  emit('confirm', enabled.value ? max.value : null)
}
</script>

<style lang="postcss" scoped>
.pool-live-vcpu-scaling-drawer .content {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
