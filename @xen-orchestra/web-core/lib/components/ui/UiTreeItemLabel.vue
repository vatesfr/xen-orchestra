<template>
  <RouterLink v-slot="{ isExactActive, href, navigate }" :to="route" custom>
    <div
      :class="isExactActive ? 'exact-active' : $props.active ? 'active' : undefined"
      :style="{ paddingLeft: `${depth * 20}px` }"
      class="ui-tree-item-label"
      v-bind="$attrs"
    >
      <UiIcon v-if="hasToggle" :icon="isExpanded ? faAngleDown : faAngleRight" @click="toggle()" />
      <a v-tooltip="hasTooltip" :href="href" class="link" @click="navigate">
        <slot name="icon">
          <UiIcon :icon="icon" class="icon" />
        </slot>
        <div ref="textElement" class="text">
          <slot />
        </div>
      </a>
      <div class="actions">
        <slot name="actions" />
      </div>
    </div>
  </RouterLink>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/ui/icon/UiIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { hasEllipsis } from '@core/utils/has-ellipsis.util'
import { IK_LIST_ITEM_EXPANDED, IK_LIST_ITEM_HAS_CHILDREN, IK_LIST_ITEM_TOGGLE } from '@core/utils/injection-keys.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { computed, inject, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  icon?: IconDefinition
  route: RouteLocationRaw
  active?: boolean
}>()

const textElement = ref<HTMLElement>()
const hasTooltip = computed(() => hasEllipsis(textElement.value))

const hasToggle = inject(
  IK_LIST_ITEM_HAS_CHILDREN,
  computed(() => false)
)

const toggle = inject(IK_LIST_ITEM_TOGGLE, () => undefined)
const isExpanded = inject(IK_LIST_ITEM_EXPANDED, ref(true))

const depth = inject('depth', 0)
</script>

<style lang="postcss" scoped>
.ui-tree-item-label {
  display: flex;
  align-items: center;
  color: var(--color-grey-100);
  border-radius: 0.8rem;
  background-color: var(--background-color-primary);
  column-gap: 0.4rem;
  padding: 0 0.8rem;

  &:hover {
    color: var(--color-grey-100);
    background-color: var(--background-color-purple-20);
  }

  &:active {
    background-color: var(--background-color-purple-30);
  }

  &.exact-active {
    background-color: var(--background-color-purple-10);

    &:hover {
      background-color: var(--background-color-purple-20);
    }

    > .ui-icon {
      color: var(--color-purple-base);
    }

    &:active {
      background-color: var(--background-color-purple-30);
    }
  }

  > .ui-icon {
    cursor: pointer;
  }
}

.link {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  padding: 0.8rem 0;
  text-decoration: none;
  color: inherit;
  gap: 1.2rem;
  font-weight: 500;
  font-size: 2rem;

  &:hover,
  .icon {
    color: var(--color-grey-100);
  }
}

.text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 1.4rem;
  padding-inline-end: 0.4rem;
}

.actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
  gap: 0.8rem;
}
</style>
