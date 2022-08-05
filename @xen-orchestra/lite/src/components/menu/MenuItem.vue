<template>
  <li class="menu-item">
    <MenuTrigger
      v-if="!$slots.submenu"
      :active="isBusy"
      :busy="isBusy"
      :disabled="disabled"
      :icon="icon"
      @click="handleClick"
    >
      <slot />
    </MenuTrigger>
    <AppMenu v-else shadow>
      <template #trigger="{ open, isOpen }">
        <MenuTrigger
          :active="isOpen"
          :disabled="disabled"
          :icon="icon"
          @click="open"
        >
          <slot />
          <UiIcon
            :fixed-width="false"
            :icon="submenuIcon"
            class="submenu-icon"
          />
        </MenuTrigger>
      </template>
      <slot name="submenu" />
    </AppMenu>
  </li>
</template>

<script lang="ts" setup>
import { computed, inject, ref, unref } from "vue";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { faAngleDown, faAngleRight } from "@fortawesome/pro-light-svg-icons";
import { noop } from "@vueuse/core";
import AppMenu from "@/components/menu/AppMenu.vue";
import MenuTrigger from "@/components/menu/MenuTrigger.vue";
import UiIcon from "@/components/ui/UiIcon.vue";

const props = defineProps<{
  icon?: IconDefinition;
  onClick?: () => any;
  disabled?: boolean;
  busy?: boolean;
}>();

const isParentHorizontal = inject("isParentMenuHorizontal", false);

const submenuIcon = computed(() =>
  unref(isParentHorizontal) ? faAngleDown : faAngleRight
);

const isHandlingClick = ref(false);
const isBusy = computed(() => isHandlingClick.value || props.busy);
const closeMenu = inject("closeMenu", noop);

const handleClick = async () => {
  isHandlingClick.value = true;
  try {
    await props.onClick?.();
    closeMenu();
  } finally {
    isHandlingClick.value = false;
  }
};
</script>

<style lang="postcss" scoped>
.submenu-icon {
  margin-left: auto;
}
</style>
