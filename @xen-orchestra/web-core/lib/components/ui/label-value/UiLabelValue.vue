<!-- v3 -->
<template>
  <div class="ui-label-value typo-body-regular">
    <!-- <div class="label-value"> -->
    <div class="label">
      {{ label }}
    </div>
    <div class="value">
      <slot name="value">
        {{ value }}
      </slot>
    </div>
    <!--
 <div v-if="slots.addons" class="addons">
      <slot name="addons" />
    </div>
-->
    <!-- </div> -->
    <div v-if="slots.actions" class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  label: string
  value?: string | string[]
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
  row-gap: 0.8rem;

  @container card (max-width: 42rem) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);

    .label {
      grid-column: 1 / -1;
      grid-row: 1;
    }

    .value {
      grid-column: 1 / -1;
      grid-row: 2;
    }

    .actions {
      grid-row: 1;
    }
  }

  @container card (min-width: 42rem) {
    grid-template-columns: 18rem minmax(12rem, 4fr) max-content;
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
    flex-direction: column;
    gap: 0.8rem;
  }

  .value:empty::before {
    content: '-';
  }

  .addons {
    margin-inline-start: -1.6rem;
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
