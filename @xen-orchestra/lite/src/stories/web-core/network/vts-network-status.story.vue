<template>
  <ComponentStory :params="[prop('items').obj().required()]">
    <div class="container">
      <div class="content">
        <p>Xo-6 type</p>
        <div v-for="item in xo6Items" :key="item">
          <VtsNetworkStatus :items="item" />
        </div>
      </div>
      <div class="content">
        <p>Xo-lite type</p>
        <div v-for="item in xoLiteItems" :key="item">
          <VtsNetworkStatus :items="item" />
        </div>
      </div>
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsNetworkStatus from '@core/components/network/VtsNetworkStatus.vue'
import { ref } from 'vue'

const xo6Items = ref([
  { attached: true, carrier: true },
  { attached: true, carrier: false },
  { attached: false, carrier: false },
])
const xoLiteItems = ref([{ currentlyAttached: true }, { currentlyAttached: false }])
</script>

<style lang="postcss" scoped>
.container {
  display: flex;
  gap: 10rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
