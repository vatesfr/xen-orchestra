<template>
  <div class="form-input-group">
    <slot />
  </div>
</template>

<style lang="postcss" scoped>
.form-input-group {
  display: inline-flex;
  align-items: center;

  &:deep(.form-input),
  &:deep(.form-select) {
    &:hover {
      z-index: 1;
    }

    &:focus-within {
      z-index: 2;
    }

    &:not(:first-child) {
      margin-left: -1px;

      .input,
      .select,
      .multiselect {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
    }

    &:not(:last-child) {
      .input,
      .select,
      .multiselect {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }
    }
  }
}
</style>
