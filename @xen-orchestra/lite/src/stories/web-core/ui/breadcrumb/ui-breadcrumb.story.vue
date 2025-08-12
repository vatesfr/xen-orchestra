<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('size').type(`'small' | 'medium'`).enum('small', 'medium').preset('medium').required().widget(),
      slot(),
    ]"
  >
    <div class="container">
      <div class="example">
        <h3>Simple example</h3>
        <UiBreadcrumb v-bind="properties">
          <UiLink :size="properties.size" to="#">Site</UiLink>
          <UiLink :size="properties.size" to="#">Backups jobs</UiLink>
          <UiLink :size="properties.size" to="#">Backups logs</UiLink>
          Current page
        </UiBreadcrumb>
      </div>

      <div class="example">
        <h3>Example with collapsed links</h3>
        <UiBreadcrumb v-bind="properties">
          <UiLink :size="properties.size" to="#">Site</UiLink>
          <div>
            <UiButtonIcon
              :id="buttonId"
              :aria-controls="listId"
              :aria-expanded="menu.more.$isOpen.value"
              aria-label="Show collapsed links"
              :icon="faEllipsisH"
              :size="properties.size"
              accent="brand"
              v-bind="omit(menu.more.$trigger, ['as', 'type'])"
            />
            <VtsMenuList :id="listId" border :aria-labelledby="buttonId" v-bind="menu.more.$target">
              <UiLink :size="properties.size" v-bind="omit(menu.more['a-link'], ['as'])">A link</UiLink>
              <UiLink :size="properties.size" v-bind="omit(menu.more['another-link'], ['as'])"> Another link </UiLink>
            </VtsMenuList>
          </div>
          <UiLink :size="properties.size" to="#">Backups jobs</UiLink>
          <UiLink :size="properties.size" to="#">Backups logs</UiLink>
          Current page
        </UiBreadcrumb>
        <UiInfo accent="warning" wrap>
          When using a button + menu to collapse links, remember to add required
          <code>aria</code>
          attributes on the button and the sublist to implement full accessibility (see example code below).
        </UiInfo>
      </div>
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import VtsMenuList from '@core/components/menu/VtsMenuList.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { routerLink, toggle, useMenu } from '@core/packages/menu'
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons'
import { objectOmit as omit } from '@vueuse/shared'
import { useId } from 'vue'

const menu = useMenu({
  more: toggle({
    items: {
      'a-link': routerLink({ name: 'home' }),
      'another-link': routerLink({ name: 'home' }),
    },
  }),
})

const buttonId = useId()
const listId = useId()
</script>

<style scoped lang="postcss">
.container {
  display: flex;
  flex-direction: column;
  gap: 4rem;

  .example {
    display: flex;
    flex-direction: column;
    gap: 2rem;

    code {
      background: var(--color-neutral-background-secondary);
      border-radius: 0.4rem;
      padding: 0.2rem;
    }
  }
}
</style>
