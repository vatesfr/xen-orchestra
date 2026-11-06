<template>
  <div class="vdf-firewall-bar">
    <h2 class="title typo-h4">{{ currentPage?.label }}</h2>
    <!-- a page's own controls (Traffic's live updates) -->
    <div :id="VDF_NAV_ACTIONS_ID" class="actions" />
    <!-- a trace is a tool, not a page: the drawer, over whichever page -->
    <UiButton
      v-if="scope.kind === 'pool'"
      size="small"
      variant="secondary"
      accent="brand"
      left-icon="fa:route"
      @click="openTrace(scope.pool.id)"
    >
      {{ t('firewall:trace:title') }}
    </UiButton>
    <!-- tech preview (vdf#42) -->
    <VdfPreviewBadge />
  </div>
</template>

<script lang="ts" setup>
import VdfPreviewBadge from '@/modules/vdf/components/VdfPreviewBadge.vue'
import { useVdfFirewallPages } from '@/modules/vdf/composables/vdf-firewall-pages.composable.ts'
import type { VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import { useVdfTraceDrawer } from '@/modules/vdf/composables/vdf-trace-drawer.composable.ts'
import { VDF_NAV_ACTIONS_ID } from '@/modules/vdf/utils/vdf-global.util.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

// Above a Firewall page, beside the list of pages: what it is, and the
// tools for any of them
const { scope } = defineProps<{
  scope: VdfScope
}>()

const { t } = useI18n()

const { currentPage } = useVdfFirewallPages(() => scope)

const { openTrace } = useVdfTraceDrawer()
</script>

<style lang="postcss" scoped>
.vdf-firewall-bar {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  min-height: 5.6rem;
  padding: 0.8rem 1.6rem;
  border-block-end: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  white-space: nowrap;

  .title {
    margin-inline-end: auto;
    color: var(--color-neutral-txt-primary);
  }

  .actions {
    display: flex;
    align-items: center;

    /* narrow: the live dot and its button, without the words */
    @media (--small) {
      :deep(.vdf-live-indicator .label) {
        display: none;
      }
    }
  }
}
</style>
