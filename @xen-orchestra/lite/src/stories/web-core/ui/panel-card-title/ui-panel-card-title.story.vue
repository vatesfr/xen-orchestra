<template>
  <ComponentStory
    v-slot="{ properties, settings }"
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
      slot('label').help('Replaces the label text; the icon and the link still come from the props'),
      setting('showLabelSlotDemo').widget(boolean()),
      slot('action').help('Displayed right after the title and its counter'),
      setting('showActionSlotDemo').widget(boolean()),
      slot('more-actions').help('Pushed to the end of the line'),
      setting('showMoreActionsSlotDemo').widget(boolean()),
    ]"
  >
    <UiPanelCardTitle v-bind="properties">
      <template v-if="settings.showLabelSlotDemo" #label>
        Backup of
        <UiLink href="#" size="medium">db-01</UiLink>
      </template>
      <template v-if="settings.showActionSlotDemo" #action>
        <UiLink href="#" size="small">See all</UiLink>
      </template>
      <template v-if="settings.showMoreActionsSlotDemo" #more-actions>
        <UiButtonIcon icon="fa:ellipsis" size="small" accent="brand" />
      </template>
    </UiPanelCardTitle>

    <div v-if="!properties.to && !properties.href" class="info">
      <VtsIcon name="status:info-circle" size="medium" />
      The label renders as plain text: it becomes a link only when `to` or `href` is provided
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { iconProp, prop, setting, slot } from '@/libs/story/story-param.ts'
import { boolean } from '@/libs/story/story-widget.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
</script>

<style lang="postcss" scoped>
.info {
  margin-top: 4rem;
  font-style: italic;
}
</style>
