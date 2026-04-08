<template>
  <div class="vts-quick-info-column">
    <slot />
  </div>
</template>

<style lang="postcss" scoped>
.vts-quick-info-column {
  container-type: inline-size;
  container-name: vts-quick-info-column;
  display: grid;
  grid-template-columns: minmax(min-content, 20rem) 1fr;
  row-gap: 1.6rem;
  column-gap: 2.4rem;
  align-items: start;
}
</style>
