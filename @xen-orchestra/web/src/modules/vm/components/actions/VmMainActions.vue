<template>
  <template v-if="!isCompact">
    <UiLink v-if="showXo5Link" :href="xo5VmGeneralHref" size="medium">
      {{ t('action:manage-in-xo-5') }}
    </UiLink>
    <VtsChangeStateMenu placement="bottom-start">
      <VmPowerStateActions :vm />
    </VtsChangeStateMenu>
  </template>
  <VtsActionsMenu :label="t('more-actions')" size="medium">
    <MenuItem v-if="showXo5Link && isCompact" accent="brand">
      <UiLink class="link" size="small" :href="xo5VmGeneralHref">
        {{ t('action:manage-in-xo-5') }}
      </UiLink>
    </MenuItem>
    <VmMoreActions :vm :show-change-state="isCompact" />
  </VtsActionsMenu>
</template>

<script lang="ts" setup>
import VmMoreActions from '@/modules/vm/components/actions/VmMoreActions.vue'
import VmPowerStateActions from '@/modules/vm/components/actions/VmPowerStateActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsChangeStateMenu from '@core/components/menu/VtsChangeStateMenu.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { IK_PANEL_ACTIONS_COMPACT } from '@core/utils/injection-keys.util.ts'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
  showXo5Link?: boolean
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const arePanelActionsCompact = inject(
  IK_PANEL_ACTIONS_COMPACT,
  computed(() => false)
)

const isCompact = computed(() => uiStore.isSmall || arePanelActionsCompact.value)

const { buildXo5Route } = useXoRoutes()

const xo5VmGeneralHref = computed(() => buildXo5Route(`/vms/${vm.id}/general`))
</script>

<style lang="postcss" scoped>
.link {
  text-decoration: none;
  padding-block: 1.2rem;
  flex-grow: 1;
}
</style>
