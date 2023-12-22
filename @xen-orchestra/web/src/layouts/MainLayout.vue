<template>
  <div class="main-layout">
    <div>XO 6 Main Layout</div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.main-layout {
  padding: 8rem;
  font-size: 3rem;
}

.content {
  padding: 2rem 4rem;
  border-bottom: 2px solid black;
}
</style>
