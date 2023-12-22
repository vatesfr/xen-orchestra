<template>
  <div class="main-layout">
    <div>XO Lite Main Layout</div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.main-layout {
  font-size: 2rem;
  padding: 4rem;
}

.content {
  padding: 1rem 2rem;
}
</style>
