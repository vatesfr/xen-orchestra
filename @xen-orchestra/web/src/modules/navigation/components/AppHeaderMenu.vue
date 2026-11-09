<template>
  <UiButtonIcon
    v-tooltip="{ content: t('more-actions'), placement: 'bottom-end' }"
    accent="brand"
    icon="action:more-actions"
    size="medium"
    @click="open()"
  />
  <Teleport to="body">
    <Transition name="slide">
      <VtsPanel v-if="isOpen" :style="{ transition: transformTransition }" class="app-header-menu">
        <template #header>
          <UiButtonIcon :target-scale="2" accent="brand" icon="fa:angle-left" size="small" @click="goBack()" />
          <span class="typo-h6">{{ title }}</span>
        </template>
        <MenuList class="menu" no-border>
          <template v-if="currentView === 'menu'">
            <VtsDropdownTitle>{{ t('menu') }}</VtsDropdownTitle>
            <MenuItem accent="brand">
              <UiLink class="link" size="small" :href="xo5Route">
                {{ t('action:open-app', { name: t('xo-5') }) }}
              </UiLink>
            </MenuItem>
            <MenuItem accent="brand" @click="currentView = 'third-parties'">
              {{ t('third-parties') }}
              <VtsIcon name="fa:angle-right" size="medium" />
            </MenuItem>
          </template>
          <ThirdPartiesMenuItems v-else />
        </MenuList>
      </VtsPanel>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import ThirdPartiesMenuItems from '@/modules/third-parties/components/ThirdPartiesMenuItems.vue'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsDropdownTitle from '@core/components/dropdown/VtsDropdownTitle.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsPanel from '@core/components/panel/VtsPanel.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { PANEL_TRANSITION_DURATION } from '@core/stores/panel.store.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

type View = 'menu' | 'third-parties'

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const xo5Route = computed(() => buildXo5Route('/'))

const isOpen = ref(false)
const currentView = ref<View>('menu')

const transformTransition = `transform ${PANEL_TRANSITION_DURATION}ms`

const title = computed(() => (currentView.value === 'menu' ? t('more-actions') : t('third-parties')))

function open() {
  currentView.value = 'menu'
  isOpen.value = true
}

function goBack() {
  if (currentView.value === 'menu') {
    isOpen.value = false
  } else {
    currentView.value = 'menu'
  }
}
</script>

<style lang="postcss" scoped>
.app-header-menu {
  position: fixed;
  inset: 0;
  z-index: 1010;
  border: none;
  border-radius: 0;

  &.slide-enter-from,
  &.slide-leave-to {
    transform: translateX(100%);
  }

  :deep(> .content) {
    padding: 0;
    overflow: auto;
  }

  :deep(.menu) {
    display: flex;
    border-radius: 0;
  }

  :deep(.vts-dropdown-title),
  :deep(.menu-item) {
    border-block-end: 0.1rem solid var(--color-neutral-border);
  }

  .link {
    text-decoration: none;
    padding-block: 1.2rem;
    flex-grow: 1;
  }
}
</style>
