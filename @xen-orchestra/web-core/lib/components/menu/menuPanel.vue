<template>
  <div class="menu-panel" :class="{ mobile: uiStore.isSmall }">
    <template v-if="uiStore.isSmall">
      <div v-if="menuVisible" class="menu-overlay">
        <VtsPanel class="mobile-menu" closable close-icon="fa:angle-left" @close="closeMenu()">
          <template #header>
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
          {{ currentPage }}
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
  icon?: IconName
  currentPage: string
  modelValue?: boolean
}>()

const emit = defineEmits<{
  close: []
  'update:modelValue': [value: boolean]
}>()

defineSlots<{
  default(): any
  menu(): any
  header(): any
  title?(): any
}>()

const uiStore = useUiStore()
const { t } = useI18n()

const menuVisible = ref(props.modelValue ?? false)

watch(
  () => props.modelValue,
  value => {
    menuVisible.value = value ?? false
  }
)

function openMenu() {
  menuVisible.value = true
  emit('update:modelValue', true)
}

function closeMenu() {
  menuVisible.value = false
  emit('update:modelValue', false)
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
      background-color: var(--color-backdrop);

      .mobile-menu {
        height: 100%;
        display: flex;
        flex-direction: column;

        :deep(.content) {
          padding: 1.6rem 0;
        }
      }
    }
  }
}
</style>
