<template>
  <div class="vdf-draft-hint">
    <UiInfo accent="info">{{ t('firewall:draft-hint') }}</UiInfo>
    <UiLink :to size="small">{{ t('firewall:draft-hint:review') }}</UiLink>
  </div>
</template>

<script lang="ts" setup>
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

// Views of what is enforced read the published document: this says there
// is more in the draft, and where to see it.
defineProps<{
  to: RouteLocationRaw
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vdf-draft-hint {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1.6rem;
}
</style>
