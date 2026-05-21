<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('error').bool().widget().preset(false),
      prop('closable').bool().widget().preset(true),
      iconProp('closeIcon')
        .preset('action:close-cancel-clear')
        .default('action:close-cancel-clear')
        .help('The close icon (can be different on mobile)'),
      event('close').args({}).help('Emitted when the user clicks the close button'),
      slot(),
      slot('header').help('Meant to receive text or other information'),
      slot('actions').help('For the main action buttons'),
      slot('more-actions').help('For other action buttons, shown in a dropdown menu'),
      slot('corner-actions').help('For action icon buttons, like the pin button on VtsSidePanel'),
      setting('headerText').widget(text()),
      setting('forceMaxWidth').widget(boolean()).preset(true).help('Simulate the side panel\'s default width'),
      setting('showButtons').widget(boolean()).preset(true),
      setting('showMoreButtons').widget(boolean()).preset(false),
      setting('showHero').widget(boolean()).preset(true),
      setting('heroType')
        .widget(choice(...stateHeroTypes))
        .preset('no-selection'),
    ]"
  >
    <VtsPanel v-bind="properties" :class="{ 'force-max-width': settings.forceMaxWidth }">
      <template v-if="settings.headerText" #header>
        <span>{{ settings.headerText }}</span>
      </template>
      <template v-if="settings.showButtons" #actions>
        <UiButton variant="tertiary" size="medium" accent="brand" left-icon="action:edit">Edit</UiButton>
        <UiButton variant="tertiary" size="medium" accent="danger" left-icon="action:delete">Delete</UiButton>
      </template>
      <template v-if="settings.showMoreButtons" #more-actions>
        <UiButton variant="tertiary" size="medium" accent="warning" left-icon="action:disconnect">
          Disconnect<UiCounter value="3" accent="warning" variant="primary" size="small" />
        </UiButton>
        <UiButton variant="tertiary" size="medium" accent="brand" left-icon="action:copy">Copy</UiButton>
        <UiButton variant="tertiary" size="medium" accent="brand" left-icon="action:download">Download</UiButton>
      </template>
      <template #default>
        <VtsStateHero v-if="settings.showHero" format="card" :type="settings.heroType" size="medium" />
        <UiCard v-else>
          <div>Card Content</div>
        </UiCard>
      </template>
    </VtsPanel>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, iconProp, prop, setting, slot } from '@/libs/story/story-param'
import { boolean, choice, text } from '@/libs/story/story-widget'
import VtsPanel from '@core/components/panel/VtsPanel.vue'
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'

const stateHeroTypes = [
  'busy',
  'no-result',
  'under-construction',
  'no-data',
  'no-selection',
  'error',
  'not-found',
  'offline',
  'all-good',
  'all-done',
  'creating',
] as const satisfies readonly StateHeroType[]
</script>

<style scoped lang="postcss">
.force-max-width {
  max-width: 40rem;
  margin: 0 auto;
}
</style>
