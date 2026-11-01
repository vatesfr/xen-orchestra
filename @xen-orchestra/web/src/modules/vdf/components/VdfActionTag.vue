<template>
  <UiTag :accent variant="secondary" class="vdf-action-tag">
    <VtsIcon :name="icon" size="small" />
    {{ label }}
  </UiTag>
</template>

<script lang="ts" setup>
import type { VdfRuleAction } from '@/modules/vdf/types.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { action, isDefault } = defineProps<{
  action: VdfRuleAction
  // a tier default rather than a rule: pass reads "next tier"
  isDefault?: boolean
}>()

const { t } = useI18n()

const accents: Record<VdfRuleAction, TagAccent> = { allow: 'success', drop: 'danger', pass: 'neutral' }

const icons: Record<VdfRuleAction, IconName> = { allow: 'fa:check', drop: 'fa:ban', pass: 'fa:arrow-down' }

const accent = computed(() => accents[action])

const icon = computed(() => icons[action])

const label = computed(() =>
  isDefault && action === 'pass' ? t('firewall:action:next-tier') : t(`firewall:action:${action}`)
)
</script>

<style lang="postcss" scoped>
.vdf-action-tag {
  gap: 0.4rem;
  width: fit-content;
  white-space: nowrap;
}
</style>
