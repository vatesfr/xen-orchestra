<!-- v1.0 -->
<template>
  <MenuList :disabled placement="bottom-start" border>
    <template #trigger="{ open, isOpen }">
      <th
        :class="[headerClass, { interactive, disabled, focus: isOpen }]"
        class="column-header"
        @click="ev => (interactive ? open(ev) : noop())"
      >
        <div class="content text-ellipsis">
          <span v-tooltip class="label">
            <VtsIcon :icon accent="current" />
            <slot />
          </span>
          <VtsIcon :icon="currentInteraction?.icon" accent="current" />
        </div>
      </th>
    </template>
    <MenuItem
      v-for="interaction in interactions"
      :key="interaction.id"
      v-tooltip="$t('coming-soon')"
      :disabled="interaction.disabled"
      :on-click="() => updateInteraction(interaction)"
    >
      <VtsIcon :icon="interaction.icon" accent="current" />
      {{ interaction.label }}
      <i v-if="currentInteraction?.id === interaction.id" class="current-interaction typo p3-regular-italic">
        {{ $t('core.current').toLowerCase() }}
      </i>
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faArrowDown, faArrowUp, faEyeSlash, faFilter, faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import { noop } from '@vueuse/core'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

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
    headerClass?: string
  }>(),
  {
    disabled: false,
    interactive: true,
  }
)
const { t } = useI18n()
const router = useRouter()

const interactions = computed<Interaction[]>(() => [
  { id: 'sort-asc', icon: faArrowDown, label: t('core.sort.ascending'), disabled: true },
  { id: 'sort-desc', icon: faArrowUp, label: t('core.sort.descending'), disabled: true },
  { id: 'group', icon: faLayerGroup, label: t('core.group'), disabled: true },
  { id: 'filter', icon: faFilter, label: t('core.filter'), disabled: true },
  { id: 'hide', icon: faEyeSlash, label: t('core.hide'), disabled: true },
])

const tableName = inject<string>('tableName')

const columnName = `${tableName}__${props.id}`

const currentInteraction = computed(() =>
  interactions.value.find(interaction => router.currentRoute.value.query[columnName] === interaction.id)
)

const updateInteraction = (interaction: Interaction) => {
  router.replace({
    query: {
      [columnName]: interaction.id,
    },
  })
}
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.column-header.interactive {
  --color: var(--color-info-txt-base);
  --background-color: var(--color-neutral-background-primary);

  &.focus {
    --color: var(--color-info-txt-base);
    --background-color: var(--color-info-background-selected);
  }

  &:hover {
    --color: var(--color-info-txt-hover);
    --background-color: var(--color-info-background-hover);
  }

  &:active {
    --color: var(--color-info-txt-active);
    --background-color: var(--color-info-background-active);
  }

  &.disabled {
    --color: var(--color-neutral-txt-secondary);
    --background-color: var(--color-neutral-background-disabled);
  }
}

/* IMPLEMENTATION */
.column-header.interactive {
  cursor: pointer;
  color: var(--color);
  background-color: var(--background-color);

  &.disabled {
    cursor: not-allowed;
  }
}

.current-interaction {
  color: var(--color-neutral-txt-secondary);
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
