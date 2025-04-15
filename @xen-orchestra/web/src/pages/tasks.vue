<template>
  <div class="tasks">
    <UiCard class="container">
      <TasksTable />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import TasksTable from '@/components/task/tasksTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
</script>

<style lang="postcss" scoped>
.tasks {
  display: grid;
  /*grid-template-columns: minmax(0, 1fr) 40rem;*/

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
