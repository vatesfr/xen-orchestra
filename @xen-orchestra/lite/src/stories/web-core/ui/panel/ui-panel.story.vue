<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('error').bool().widget().preset(false),
      prop('closable').bool().widget().preset(true),
      slot(),
      slot('header').help('Meant to receive UiButton or other information'),
      setting('forceMaxWidth').widget(boolean()).preset(true).help('Simulate the side panel\'s default width'),
      setting('showDemoButtons').widget(boolean()).preset(true),
      setting('moreButtons')
        .widget(boolean())
        .preset(false)
        .help('Combine with forceMaxWidth to test the header scroll behaviour'),
      setting('showHero').widget(boolean()).preset(true),
      setting('heroType')
        .widget(choice(...stateHeroTypes))
        .preset('no-selection'),
    ]"
  >
    <UiSidePanel v-bind="properties" :class="{ 'force-max-width': settings.forceMaxWidth }">
      <template #header>
        <template v-if="settings.showDemoButtons">
          <UiButton variant="tertiary" size="medium" accent="brand" left-icon="action:edit">Edit</UiButton>
          <UiButton variant="tertiary" size="medium" accent="danger" left-icon="action:delete">Delete</UiButton>
          <template v-if="settings.moreButtons">
            <UiButton variant="tertiary" size="medium" accent="warning" left-icon="action:disconnect">
              Disconnect<UiCounter value="3" accent="warning" variant="primary" size="small" />
            </UiButton>
          </template>
        </template>
      </template>
      <VtsStateHero v-if="settings.showHero" format="card" :type="settings.heroType" size="medium" />
      <UiCard v-else>
        <div>Card Content</div>
      </UiCard>
    </UiSidePanel>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { boolean, choice } from '@/libs/story/story-widget'
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiSidePanel from '@core/components/ui/panel/UiPanel.vue'

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
