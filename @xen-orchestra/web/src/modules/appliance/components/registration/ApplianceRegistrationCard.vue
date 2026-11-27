<template>
  <UiCard class="appliance-registration-card">
    <UiCardTitle>
      {{ t('appliance:registration') }}
      <template v-if="registered === true" #info>
        <ApplianceChangeAccountButton />
      </template>
    </UiCardTitle>

    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('status')">
        <template v-if="registered !== undefined" #value>
          <UiInfo v-if="registered" accent="success">{{ t('appliance:registered') }}</UiInfo>
          <UiInfo v-else accent="warning">{{ t('appliance:not-registered') }}</UiInfo>
        </template>
      </VtsTabularKeyValueRow>
      <template v-if="registered === true">
        <VtsTabularKeyValueRow :label="t('account')" :value="account" />
        <VtsTabularKeyValueRow :label="t('appliance:since')" :value="since" />
        <VtsTabularKeyValueRow :label="t('appliance:licenses')">
          <template #value>
            <UiLink :href="buildXo5Route('/xoa/licenses')" size="small">
              {{ t('appliance:manage-in-xo-5') }}
            </UiLink>
          </template>
        </VtsTabularKeyValueRow>
      </template>
    </VtsTabularKeyValueList>

    <template v-if="registered === false">
      <p class="hint typo-body-regular-small">{{ t('appliance:registration-hint') }}</p>
      <div class="actions">
        <ApplianceRegisterButton />
        <UiLink :href="XO_LINKS.VATES_ACCOUNT" size="small">
          {{ t('appliance:create-account') }}
        </UiLink>
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import ApplianceChangeAccountButton from '@/modules/appliance/components/actions/change-account/ApplianceChangeAccountButton.vue'
import ApplianceRegisterButton from '@/modules/appliance/components/actions/register/ApplianceRegisterButton.vue'
import { XO_LINKS } from '@/shared/constants.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { formatDate } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { registered = undefined, registeredSince } = defineProps<{
  registered?: boolean
  account?: string
  registeredSince?: number
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const since = computed(() => {
  if (registeredSince === undefined) {
    return undefined
  }

  return formatDate(registeredSince)
})
</script>

<style lang="postcss" scoped>
.appliance-registration-card {
  .hint {
    color: var(--color-neutral-txt-secondary);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.6rem;
  }
}
</style>
