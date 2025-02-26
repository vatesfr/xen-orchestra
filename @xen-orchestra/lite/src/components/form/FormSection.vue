<template>
  <div :class="{ collapsible }" class="form-section">
    <fieldset class="fieldset">
      <legend class="legend typo-h4" @click="toggleCollapse">
        {{ label }}
        <UiIcon :icon class="collapse-icon" />
      </legend>
      <div v-if="!isCollapsed" class="content">
        <slot />
      </div>
    </fieldset>
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { useVModel, whenever } from '@vueuse/core'
import { computed } from 'vue'

const props = defineProps<{
  label: string
  collapsible?: boolean
  collapsed?: boolean
}>()

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
}>()

const isCollapsed = useVModel(props, 'collapsed', emit)

const toggleCollapse = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value
  }
}

const icon = computed(() => {
  if (!props.collapsible) {
    return undefined
  }

  return isCollapsed.value ? faChevronDown : faChevronUp
})

whenever(
  () => !props.collapsible,
  () => (isCollapsed.value = false)
)
</script>

<style lang="postcss" scoped>
.collapsible {
  padding: 1rem 1.5rem;
  background-color: var(--color-brand-background-selected);
  border-radius: 0.8rem;
}

.fieldset {
  border: none;
  margin: 0;
  padding: 0;
}

.legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-brand-txt-base);
  border: none;
  border-bottom: 1px solid var(--color-brand-txt-base);
  width: 100%;
  padding-bottom: 1rem;

  .collapsible & {
    color: var(--color-neutral-txt-primary);
    padding-bottom: 0;
    cursor: pointer;
  }
}

.content {
  padding: 1.5rem 0;
}

.collapse-icon {
  color: var(--color-brand-txt-base);
}
</style>
