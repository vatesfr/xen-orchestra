<template>
  <UiHeadBar icon="object:plugin">
    {{ plugin.name }}
    <template #status>
      <UiTag v-if="plugin.version !== undefined" accent="neutral" variant="secondary">
        {{ t('version-number', { version: plugin.version }) }}
      </UiTag>
      <UiTag
        v-if="plugin.configurationSchema !== undefined"
        :accent="plugin.configured ? 'success' : 'warning'"
        variant="secondary"
      >
        {{ configurationStatus }}
      </UiTag>
    </template>
    <template #actions>
      <PluginActions :plugin />
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import PluginActions from '@/modules/plugin/components/actions/PluginActions.vue'
import { useXoPluginUtils } from '@/modules/plugin/composables/xo-plugin-utils.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { useI18n } from 'vue-i18n'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
}>()

const { t } = useI18n()

const { configurationStatus } = useXoPluginUtils(() => plugin)
</script>
