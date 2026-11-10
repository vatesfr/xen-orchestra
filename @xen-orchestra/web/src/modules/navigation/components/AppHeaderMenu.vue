<template>
  <VtsMobileMenu :title="t('more-actions')">
    <template #trigger="{ open }">
      <UiButtonIcon
        v-tooltip="{ content: t('more-actions'), placement: 'bottom-end' }"
        accent="brand"
        icon="action:more-actions"
        size="medium"
        @click="open()"
      />
    </template>
    <VtsDropdownTitle>{{ t('menu') }}</VtsDropdownTitle>
    <MenuItem accent="brand">
      <UiLink class="link" size="small" :href="xo5Route">
        {{ t('action:open-app', { name: t('xo-5') }) }}
      </UiLink>
    </MenuItem>
    <MenuItem accent="brand">
      {{ t('third-parties') }}
      <template #submenu>
        <ThirdPartiesMenuItems />
      </template>
    </MenuItem>
  </VtsMobileMenu>
</template>

<script lang="ts" setup>
import ThirdPartiesMenuItems from '@/modules/third-parties/components/ThirdPartiesMenuItems.vue'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsDropdownTitle from '@core/components/dropdown/VtsDropdownTitle.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsMobileMenu from '@core/components/menu/VtsMobileMenu.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const xo5Route = computed(() => buildXo5Route('/'))
</script>

<style lang="postcss" scoped>
.link {
  text-decoration: none;
  padding-block: 1.2rem;
  flex-grow: 1;
}
</style>
