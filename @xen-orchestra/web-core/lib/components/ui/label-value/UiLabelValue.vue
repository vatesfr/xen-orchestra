<!-- v3 -->
<template>
  <div class="ui-label-value typo-body-regular">
    <!-- <div class="label-value"> -->
    <div class="label">
      {{ label }}
    </div>
    <div class="value">
      <div class="valueActionWrapper">
        <div class="valueAddonWraper">
          <slot name="value">
            <div v-if="value && !Array.isArray(value)" v-tooltip="wrap" :class="{ 'text-ellipsis': wrap }">
              {{ value }}
            </div>
            <UiTagsList
              v-else-if="Array.isArray(value) && value.length > 0"
              v-tooltip="wrap"
              :class="{ 'text-ellipsis': wrap }"
            >
              <UiTag v-for="tag in value" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
            </UiTagsList>
          </slot>
          <div v-if="slots.addons" class="addons">
            <slot name="addons" />
          </div>
        </div>

        <div v-if="slots.actions" class="actions">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { vTooltip } from '@core/directives/tooltip.directive'
import UiTag from '../tag/UiTag.vue'
import UiTagsList from '../tag/UiTagsList.vue'

defineProps<{
  label: string
  value?: string | string[]
  wrap?: boolean
}>()

const slots = defineSlots<{
  value?(): any
  addons?(): any
  actions?(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-label-value {
  display: grid;
  column-gap: 1.6rem;
  grid-template-columns: 20rem;
  row-gap: 0.8rem;
  container-type: inline-size;
  container-name: card;

  @container card (max-width: 42rem) {
    .label {
      grid-column: 1;
      grid-row: 1;
    }

    .value {
      grid-column: 1;
      grid-row: 2;
      width: 100cqi;
    }
  }

  @container card (min-width: 42rem) {
    .label {
      grid-column: 1;
      grid-row: 1;
      width: 20rem;
    }
    .value {
      grid-column: 2;
      grid-row: 1;
      align-items: left;
    }
  }

  .label {
    overflow-wrap: break-word;
    color: var(--color-neutral-txt-secondary);
  }

  .value {
    overflow-wrap: break-word;
    min-width: 0;
    color: var(--color-neutral-txt-primary);
    display: flex;
    align-items: left;
    gap: 0.8rem;
  }

  .valueAddonWraper:empty::before {
    content: '-';
  }

  .valueActionWrapper {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .valueAddonWraper {
    display: flex;
    gap: 0.8rem;
    width: 100%;
  }

  .actions {
    display: flex;
    gap: 0.8rem;
    margin-inline-start: auto;
    font-size: 1.6rem;
    align-items: flex-start;
  }
}
</style>
