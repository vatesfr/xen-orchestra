<template>
  <ComponentStory :params>
    <UiLink v-bind="bindings">This is a link</UiLink>

    <div v-if="!bindings.to && !bindings.href" class="info">
      <VtsIcon :icon="faInfoCircle" accent="info" />
      Link is disabled because no `href` or `to` is provided
    </div>
    <div v-else-if="bindings.to && bindings.href" class="info">
      <VtsIcon :icon="faExclamationTriangle" accent="info" />
      `to` is ignored when `href` is provided
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { iconChoice } from '@core/packages/story/story-param.ts'
import { choice } from '@core/packages/story/story-widget.ts'
import { useStory } from '@core/packages/story/use-story.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const { params, bindings } = useStory({
  props: {
    size: {
      preset: 'medium' as const,
      type: '"small" | "medium"',
      widget: choice('small', 'medium'),
      required: true,
    },
    to: {
      preset: ref<RouteLocationRaw>(),
      type: 'RouteLocationRaw',
      widget: choice('dashboard'),
    },
    href: {
      preset: ref<string>(),
      type: 'string',
    },
    icon: {
      preset: ref<IconDefinition>(),
      type: 'IconDefinition',
      widget: iconChoice(),
    },
    disabled: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
    target: {
      preset: ref<'_blank' | '_self'>(),
      type: '"_blank" | "_self"',
      widget: choice('_blank', '_self'),
    },
  },
})
</script>

<style lang="postcss" scoped>
.info {
  margin-top: 4rem;
  font-style: italic;
}
</style>
