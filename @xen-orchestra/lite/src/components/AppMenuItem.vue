<template>
  <UiMenuItem
    :active="isSubmenuOpen"
    :disabled="disabled"
    class="app-menu-item"
    @click="handleClick"
    ref="item"
  >
    <FontAwesomeIcon
      v-if="icon !== undefined"
      :icon="icon"
      :spin="isBusy"
      class="icon"
      fixed-width
    />
    <slot />
    <FontAwesomeIcon
      v-if="$slots.submenu"
      :icon="faAngleRight"
      class="submenu-icon"
      fixed-width
    />
    <UiMenu v-if="$slots.submenu && isSubmenuOpen" @click.stop ref="submenu">
      <slot name="submenu" />
    </UiMenu>
  </UiMenuItem>
</template>

<script lang="ts" setup>
import { computed, inject, ref, useSlots, nextTick, watch } from "vue";
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { faAngleRight, faSpinner } from "@fortawesome/pro-light-svg-icons";
import { onClickOutside } from "@vueuse/core";
import UiMenu from "@/components/ui/UiMenu.vue";
import UiMenuItem from "@/components/ui/UiMenuItem.vue";
import placement from 'placement.js';

const props = defineProps<{
  icon?: IconDefinition;
  disabled?: boolean;
  onClick?: (...args: any[]) => any;
}>();

const item = ref();
const slots = useSlots();
const isBusy = ref(false);
const isSubmenuOpen = ref(false);
const closeMenu = inject("appMenuClose", () => undefined);
const icon = computed(() => (isBusy.value ? faSpinner : props.icon));
const submenu = ref();

onClickOutside(item, () => (isSubmenuOpen.value = false));

const handleClick = async (event: PointerEvent) => {
  if (props.disabled) {
    return;
  }

  if (slots.submenu) {
    isSubmenuOpen.value = !isSubmenuOpen.value;
    if (isSubmenuOpen.value) {
      nextTick(() => {
        placement(
          item.value.$el,
          submenu.value.$el,
          {
            placement: 'right-start'
          }
        )
      })
    }
    return;
  }

  isBusy.value = true;

  try {
    await props.onClick?.();
    closeMenu();
  } finally {
    isBusy.value = false;
  }
};
</script>

<style scoped>
.icon {
  font-size: 2.4rem;
}

.submenu-icon {
  margin-left: auto;
}
</style>
