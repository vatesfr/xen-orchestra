<template>
  <MenuList :disabled="disabled" placement="bottom-start" shadow>
    <template #trigger="{ open, isOpen }">
      <th
        :class="{ interactive, disabled, focus: isOpen }"
        class="column-header"
        @click="ev => (interactive ? open(ev) : noop())"
      >
        <div class="content">
          <span class="label">
            <UiIcon :icon />
            <slot />
          </span>
          <UiIcon v-if="currentInteraction !== undefined" :icon="currentInteraction.icon" />
        </div>
      </th>
    </template>
    <MenuItem
      v-for="interaction in interactions"
      v-tooltip="$t('core.coming-soon')"
      :disabled="interaction.disabled"
      :key="interaction.id"
      :on-click="() => updateInteraction(interaction)"
    >
      <UiIcon :icon="interaction.icon" />{{ interaction.label }}
      <i v-if="currentInteraction?.id === interaction.id" class="current-interaction">
        {{ $t('core.current').toLowerCase() }}
      </i>
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import MenuList from '@core/components/menu/MenuList.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiIcon from '@core/components/icon/UiIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faArrowDown, faArrowUp, faEyeSlash, faFilter, faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import { noop } from '@vueuse/core'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

type InteractionId = 'sort-asc' | 'sort-desc' | 'group' | 'filter' | 'hide'
type Interaction = {
  disabled?: boolean
  id: InteractionId
  icon: IconDefinition
  label: string
}

const props = withDefaults(
  defineProps<{
    id?: string
    icon?: IconDefinition
    interactive?: boolean
    disabled?: boolean
  }>(),
  {
    disabled: false,
    interactive: true,
  }
)
const { t } = useI18n()
const router = useRouter()

const interactions: readonly Interaction[] = [
  { id: 'sort-asc', icon: faArrowDown, label: t('core.sort.ascending'), disabled: true },
  { id: 'sort-desc', icon: faArrowUp, label: t('core.sort.descending'), disabled: true },
  { id: 'group', icon: faLayerGroup, label: t('core.group'), disabled: true },
  { id: 'filter', icon: faFilter, label: t('core.filter'), disabled: true },
  { id: 'hide', icon: faEyeSlash, label: t('core.hide'), disabled: true },
]

const tableName = inject<string>('tableName')

const currentInteraction = computed(() =>
  interactions.find(interaction => router.currentRoute.value.query[columnName] === interaction.id)
)

const columnName = `${tableName}__${props.id}`

const updateInteraction = (interaction: Interaction) => {
  router.replace({
    query: {
      [columnName]: interaction.id,
    },
  })
}
</script>

<style lang="postcss" scoped>
.column-header.interactive {
  cursor: pointer;
  color: var(--color-purple-base);

  &:is(.focus) {
    background-color: var(--background-color-purple-10);
  }
  &:is(:hover) {
    background-color: var(--background-color-purple-20);
    color: var(--color-purple-d20);
  }
  &:is(:active) {
    background-color: var(--background-color-purple-30);
    color: var(--color-purple-d40);
  }

  &:is(.disabled) {
    background-color: var(--background-color-secondary);
    color: var(--color-grey-400);
    cursor: not-allowed;
  }
}

.current-interaction {
  color: var(--color-grey-300);
  font-size: 1.4rem;
}

.content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.label {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-icon {
  cursor: pointer;
}
</style>
