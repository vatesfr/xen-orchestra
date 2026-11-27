<template>
  <UiCard>
    <UiCardTitle>
      {{ t('appliance:update-settings') }}
      <template #info>
        <ApplianceEditUpdateSettingsButton />
      </template>
    </UiCardTitle>

    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('appliance:release-channel')" :value="channel" />
      <VtsTabularKeyValueRow :label="t('appliance:daily-check')">
        <template v-if="dailyCheckEnabled !== undefined" #value>
          <VtsEnabledState :enabled="dailyCheckEnabled" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('appliance:install')" :value="t('appliance:manual-install')" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script lang="ts" setup>
import ApplianceEditUpdateSettingsButton from '@/modules/appliance/components/actions/edit-update-settings/ApplianceEditUpdateSettingsButton.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  channel: string
  dailyCheckEnabled?: boolean
}>()

const { t } = useI18n()
</script>
