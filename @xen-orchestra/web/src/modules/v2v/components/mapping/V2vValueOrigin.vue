<template>
  <div class="v2v-value-origin">
    <UiTag :accent="tag.accent" variant="secondary">{{ tag.label }}</UiTag>
    <UiButton v-if="origin === 'overridden'" accent="brand" variant="tertiary" size="small" @click="emit('reset')">
      {{ t('action:reset-to-default') }}
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vTargetOrigin } from '@/modules/v2v/types/v2v-mapping.type.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { origin } = defineProps<{
  origin: V2vTargetOrigin
}>()

const emit = defineEmits<{
  reset: []
}>()

const { t } = useI18n()

const { getOriginTag } = useV2vVmLabels()

const tag = computed(() => getOriginTag(origin))
</script>

<style lang="postcss" scoped>
.v2v-value-origin {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
