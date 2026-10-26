import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoPluginUtils(rawPlugin: MaybeRefOrGetter<FrontXoPlugin>) {
  const plugin = toComputed(rawPlugin)

  const { t } = useI18n()

  const keywords = computed(() => plugin.value.keywords ?? [])

  const configurationStatus = computed(() => {
    if (plugin.value.configurationSchema === undefined) {
      return t('plugin:not-configurable')
    }

    return plugin.value.configured ? t('status:configured') : t('status:not-configured')
  })

  return { keywords, configurationStatus }
}
