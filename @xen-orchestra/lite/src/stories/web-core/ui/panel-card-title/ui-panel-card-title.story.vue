<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('size').required().enum('small', 'medium').preset('medium').widget(),
      prop('label').str().preset('Label').widget(),
      iconProp(),
      prop('id')
        .str()
        .preset('71df26a2-678a-49c7-8232-8ebcac4987ab')
        .widget()
        .help('Displayed below the label, with a copy button'),
      prop('counter')
        .num()
        .widget()
        .help(
          'Also accepts `{ value, accent }` to change the counter accent, e.g. `{ value: 3, accent: \'warning\' }`'
        ),
      prop('to').str().widget(),
      prop('href').str().widget(),
      prop('target').enum('_blank', '_self').widget(),
      prop('disabled').bool().widget(),
    ]"
  >
    <UiPanelCardTitle v-bind="properties" />

    <div v-if="!properties.to && !properties.href" class="info">
      <VtsIcon name="status:info-circle" size="medium" />
      The label renders as plain text: it becomes a link only when `to` or `href` is provided
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop } from '@/libs/story/story-param.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
</script>

<style lang="postcss" scoped>
.info {
  margin-top: 4rem;
  font-style: italic;
}
</style>
