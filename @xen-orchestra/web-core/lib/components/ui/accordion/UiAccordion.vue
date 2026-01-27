<template>
  <div class="accondion">
    <UiAccordionItem
      accent="large"
      title="test"
      :is-expanded="expandedIndex === 0"
      text="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. "
      @toggle="toggle(0)"
    />
    <UiAccordionItem
      accent="large"
      title="test"
      :is-expanded="expandedIndex === 1"
      text="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. "
      @toggle="toggle(1)"
    />
    <UiAccordionItem
      accent="large"
      title="test"
      :is-expanded="expandedIndex === 2"
      text="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. "
      @toggle="toggle(2)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UiAccordionItem from '../accordion-item/UiAccordionItem.vue'

const expandedIndex = ref<number | null>(0)

const toggle = (index: number) => {
  expandedIndex.value = expandedIndex.value === index ? null : index
}
</script>

<style scoped lang="postcss">
.accondion {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
