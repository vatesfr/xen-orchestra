<template>
  <div class="plugin-breadcrumb-link">
    <UiBreadcrumb :size>
      <UiLink :size :to="{ name: '/admin/plugins' }" icon="object:plugin">
        {{ t('plugins') }}
      </UiLink>
      <span>{{ plugin.name }}</span>
    </UiBreadcrumb>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  plugin: FrontXoPlugin
}>()

const uiStore = useUiStore()

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.plugin-breadcrumb-link {
  min-height: 5.6rem;
  padding: 1.2rem 1.6rem;
  display: flex;
  align-items: center;
  border-block-end: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  overflow-y: auto;
}
</style>
