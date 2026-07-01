<template>
  <UiCard>
    <UiTitle>
      {{ t('custom-fields') }}
    </UiTitle>

    <div>
      <VtsStateHero
        v-if="Object.keys(customFields).length === 0"
        type="no-data"
        format="card"
        horizontal
        size="extra-small"
      >
        {{ t('no-custom-field-detected') }}
      </VtsStateHero>
      <VtsTabularKeyValueList v-else>
        <VtsTabularKeyValueRow v-for="(value, label) in customFields" :key="label" :label :value />
      </VtsTabularKeyValueList>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const customFields = computed(() => {
  const prefix = 'XenCenter.CustomFields.'

  return Object.entries(sr.other_config).reduce<Record<string, string>>((acc, [key, value]) => {
    if (key.startsWith(prefix)) {
      acc[key.slice(prefix.length)] = value
    }

    return acc
  }, {})
})
</script>
