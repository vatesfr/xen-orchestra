<template>
  <VtsStateHero v-if="!isUserReady" format="page" type="busy" size="large" />
  <VtsStateHero v-else-if="hasUserError || !user" format="page" type="error" size="large" />
  <div v-else class="scroll-container">
    <div class="container">
      <VtsColumns>
        <VtsColumn>
          <AccountInfoCard :user />
          <AccountPasswordCard :user />
          <AccountOtpCard :user />
        </VtsColumn>
        <VtsColumn>
          <AccountAvatarCard />
          <AccountSsoCard :user />
        </VtsColumn>
      </VtsColumns>
      <UiCard>
        <AccountSshKeysTable :user>
          <template #title-actions>
            <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="openNewSshKeyDrawer()">
              {{ t('new') }}
            </UiButton>
          </template>
        </AccountSshKeysTable>
      </UiCard>
      <UiCard>
        <AccountAuthenticationTokensTable :user>
          <template #title-actions>
            <UiButton
              variant="primary"
              accent="brand"
              size="medium"
              left-icon="fa:plus"
              @click="openNewAuthenticationTokenDrawer()"
            >
              {{ t('new') }}
            </UiButton>
          </template>
        </AccountAuthenticationTokensTable>
      </UiCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import AccountAuthenticationTokensTable from '@/modules/account/components/authentication-token/AccountAuthenticationTokensTable.vue'
import AccountAvatarCard from '@/modules/account/components/cards/AccountAvatarCard.vue'
import AccountInfoCard from '@/modules/account/components/cards/AccountInfoCard.vue'
import AccountOtpCard from '@/modules/account/components/cards/AccountOtpCard.vue'
import AccountPasswordCard from '@/modules/account/components/cards/AccountPasswordCard.vue'
import AccountSsoCard from '@/modules/account/components/cards/AccountSsoCard.vue'
import AccountSshKeysTable from '@/modules/account/components/ssh-key/AccountSshKeysTable.vue'
import { useNewAuthenticationToken } from '@/modules/account/composables/use-new-authentication-token.composable.ts'
import { useNewSshKey } from '@/modules/account/composables/use-new-ssh-key.composable.ts'
import { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { user, isUserReady, hasUserError } = useXoUserResource({}, () => 'me')

const { openNewSshKeyDrawer } = useNewSshKey(user)

const { openNewAuthenticationTokenDrawer } = useNewAuthenticationToken()
</script>

<style scoped lang="postcss">
.scroll-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.container {
  height: fit-content;
  gap: 0.8rem;
  margin: 0.8rem;
  display: flex;
  flex-direction: column;
}
</style>
