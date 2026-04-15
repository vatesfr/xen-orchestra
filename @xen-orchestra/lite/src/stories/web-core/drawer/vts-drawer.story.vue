<template>
  <ComponentStory
    :params="[
      prop('dismissible').bool().widget().help('Allow closing via backdrop click, dismiss button and Escape key'),
      event('confirm').help('Emitted when confirmed'),
      event('cancel').help('Emitted when cancelled'),
      slot('title').help('Drawer title'),
      slot('content').help('Main content area'),
      slot('buttons').help('Footer buttons area'),
    ]"
    :presets="{
      Default: { props: { dismissible: true } },
    }"
  >
    <UiButton variant="primary" accent="brand" size="medium" @click="openDrawer()">Open Drawer</UiButton>
    <VtsDrawerList />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop, slot } from '@/libs/story/story-param'
import VtsDrawerList from '@core/components/drawer/VtsDrawerList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useDrawer } from '@core/packages/drawer/use-drawer.ts'
import DrawerDemo from './DrawerDemo.vue'

const openDrawer = useDrawer({
  component: Promise.resolve({ default: DrawerDemo }),
  props: { dismissible: true },
})
</script>
