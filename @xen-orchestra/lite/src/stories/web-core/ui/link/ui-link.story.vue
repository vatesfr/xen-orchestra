<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('size').required().enum('small', 'medium').preset('medium').widget(),
      prop('to').str().widget(),
      prop('href').str().widget(),
      iconProp(),
      prop('disabled').bool().widget(),
      prop('target').enum('_blank', '_self').widget(),
    ]"
  >
    <UiLink v-bind="properties">This is a link</UiLink>

    <div v-if="!properties.to && !properties.href" class="info">
      <VtsIcon :icon="faInfoCircle" accent="info" />
      Link is disabled because no `href` or `to` is provided
    </div>
    <div v-else-if="properties.to && properties.href" class="info">
      <VtsIcon :icon="faExclamationTriangle" accent="info" />
      `to` is ignored when `href` is provided
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
</script>

<style lang="postcss" scoped>
.info {
  margin-top: 4rem;
  font-style: italic;
}
</style>
