<template>
  <div class="menu-panel" :class="{ mobile: uiStore.isSmall }">
    <template v-if="uiStore.isSmall">
      <div v-if="menuVisible" class="menu-overlay">
        <VtsPanel class="mobile-menu">
          <template #header>
            <UiButtonIcon
              accent="brand"
              variant="tertiary"
              size="medium"
              icon="fa:angle-left"
              @click="goPreviousPage()"
            />
            <VtsIcon v-if="icon" size="large" :name="icon" />
            {{ title }}
          </template>
          <VtsDropdownTitle>{{ t('menu') }}</VtsDropdownTitle>
          <span @click="closeMenu()">
            <slot name="menu" />
          </span>
        </VtsPanel>
      </div>
      <template v-else>
        <slot name="header" />
        <UiHeadBar>
          <template #icon>
            <UiButtonIcon icon="fa:angle-left" size="medium" accent="brand" @click="openMenu()" />
          </template>
          {{ currentPageTitle }}
        </UiHeadBar>
        <div class="page">
          <slot name="default" />
        </div>
      </template>
    </template>
    <template v-else>
      <slot name="header" />
      <UiHeadBar :icon>
        {{ title }}
      </UiHeadBar>
      <div class="menu-panel-inner">
        <div class="menu">
          <slot name="menu" />
        </div>
        <div class="page">
          <slot name="default" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import VtsDropdownTitle from '@core/components/dropdown/VtsDropdownTitle.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsPanel from '@core/components/panel/VtsPanel.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import type { IconName } from '@core/icons/index.ts'
import { useUiStore } from '@core/stores/ui.store'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  title: string
  currentPageTitle: string
  icon?: IconName
  isOpen?: boolean
}>()

const emit = defineEmits<{
  close: []
  back: []
  'update:isOpen': [value: boolean]
}>()

defineSlots<{
  default(): any
  header(): any
  menu(): any
  title?(): any
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const menuVisible = ref(props.isOpen ?? false)

watch(
  () => props.isOpen,
  value => {
    menuVisible.value = value ?? false
  }
)

function openMenu() {
  menuVisible.value = true
  emit('update:isOpen', true)
}

function closeMenu() {
  menuVisible.value = false
  emit('update:isOpen', false)
}

function goPreviousPage() {
  menuVisible.value = false
  emit('update:isOpen', false)
  emit('back')
}
</script>

<style scoped lang="postcss">
.menu-panel {
  &:not(.mobile) {
    .menu-panel-inner {
      display: flex;

      .menu {
        height: fit-content;
        margin: 0.8rem 0 0.8rem 0.8rem;
      }

      .page {
        width: 100%;
      }
    }
  }

  &.mobile {
    .menu-overlay {
      z-index: 1010;
      position: fixed;
      inset: 0;

      .mobile-menu {
        height: 100%;

        .header {
          width: 100%;
        }

        :deep(.content) {
          padding: 1.6rem 0;
        }
      }
    }
  }
}
</style>
