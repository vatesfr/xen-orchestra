import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { getPluginDescription, isPluginLoaded } from '@/modules/plugin/utils/xo-plugin.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoPluginUtils(rawPlugin: MaybeRefOrGetter<FrontXoPlugin>) {
  const plugin = toComputed(rawPlugin)

  const { t } = useI18n()

  const description = computed(() => getPluginDescription(plugin.value))

  const isLoaded = computed(() => isPluginLoaded(plugin.value))

  const keywords = computed(() => plugin.value.keywords ?? [])

  const configurationStatus = computed(() => {
    if (plugin.value.configurationSchema === undefined) {
      return t('plugin:not-configurable')
    }

    return plugin.value.configured ? t('status:configured') : t('status:not-configured')
  })

  return { description, isLoaded, keywords, configurationStatus }
}
