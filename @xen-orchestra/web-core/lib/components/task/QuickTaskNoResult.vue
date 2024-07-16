<template>
  <li class="vts-quick-task-no-result">
    <div class="content">
      <div class="typo p1-medium">
        {{ $t('tasks.no-tasks') }}
      </div>
    </div>
  </li>
</template>

<style lang="postcss" scoped>
.vts-quick-task-no-result {
  display: flex;
}

.content {
  flex: 1;
  padding: 0.4rem 0.4rem 0.4rem 0.8rem;
}
</style>
