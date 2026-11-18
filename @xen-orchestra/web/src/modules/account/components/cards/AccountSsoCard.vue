<template>
  <UiCard class="account-sso-card">
    <UiTitle>{{ t('sso-authentication') }}</UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('authenticator-apps')">
        <template v-if="authenticatorApps.length > 0" #value>
          <div class="authenticator-apps">
            <span v-for="app of authenticatorApps" :key="app">{{ app }}</span>
          </div>
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoUser } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: XoUser
}>()

const { t } = useI18n()

const authenticatorApps = computed(() => Object.keys(user.authProviders ?? {}))
</script>

<style lang="postcss" scoped>
.account-sso-card {
  .authenticator-apps {
    display: flex;
    flex-direction: column;
  }
}
</style>
