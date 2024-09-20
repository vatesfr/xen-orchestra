<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('accent').required().enum('brand', 'success', 'warning', 'danger').preset('brand').widget(),
      prop('size').required().enum('small', 'medium').preset('medium').widget(),
      prop('to').type('IconDefinition').widget(text()),
      prop('href').str().widget(),
      iconProp(),
      prop('disabled').bool().widget(),
      prop('target').enum('_blank', '_self').widget(),
    ]"
  >
    <VtsLink v-bind="properties">This is a link</VtsLink>

    <div v-if="!properties.to && !properties.href" class="info">
      <UiIcon :icon="faInfoCircle" color="normal" />
      Link is disabled because no `href` or `to` is provided
    </div>
    <div v-else-if="properties.to && properties.href" class="info">
      <UiIcon :icon="faExclamationTriangle" color="warning" />
      `to` is ignored when `href` is provided
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import UiIcon from '@core/components/icon/UiIcon.vue'
import VtsLink from '@core/components/link/VtsLink.vue'
import { faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
</script>

<style lang="postcss" scoped>
.info {
  margin-top: 4rem;
  font-style: italic;
}
</style>
