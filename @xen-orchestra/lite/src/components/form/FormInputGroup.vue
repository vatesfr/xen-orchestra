<template>
  <div class="form-input-group">
    <slot />
  </div>
</template>

<style lang="postcss" scoped>
.form-input-group {
  display: inline-flex;
  align-items: center;

  :slotted(.form-input),
  :slotted(.form-select) {
    &:hover {
      z-index: 1;
    }

    &:focus-within {
      z-index: 2;
    }

    &:not(:first-child) {
      margin-left: -1px;

      .input,
      .select {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
    }

    &:not(:last-child) {
      .input,
      .select {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }
    }
  }
}
</style>
