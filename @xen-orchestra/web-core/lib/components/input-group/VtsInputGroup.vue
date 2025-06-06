<template>
  <div class="vts-input-group">
    <slot />
  </div>
</template>

<style lang="postcss" scoped>
.vts-input-group {
  display: flex;
  align-items: center;

  :slotted(> .ui-input),
  :slotted(> .vts-select) {
    &:hover {
      z-index: 1;
    }

    &:focus-within {
      z-index: 2;
    }

    &:not(:first-child) {
      margin-left: -1px;

      &,
      .ui-input {
        border-start-start-radius: 0;
        border-end-start-radius: 0;
      }
    }

    &:not(:last-child) {
      &,
      .ui-input {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
      }
    }
  }
}
</style>
