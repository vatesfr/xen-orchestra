<template>
  <UiCard class="appliance-version-card">
    <UiCardTitle>
      {{ t('version') }}
      <template v-if="upgrade !== undefined || !checking" #info>
        <UiTag v-if="upgrade !== undefined" accent="info" variant="secondary">
          {{ t('appliance:installing') }}
        </UiTag>
        <UiTag v-else-if="!registered" accent="warning" icon="fa:lock" variant="secondary">
          {{ t('appliance:updates-blocked') }}
        </UiTag>
        <UiTag v-else-if="!hasUpdates" accent="success" icon="fa:check" variant="secondary">
          {{ t('up-to-date') }}
        </UiTag>
        <UiTag v-else accent="info" icon="action:download" variant="secondary">
          {{ t('appliance:update-available') }}
        </UiTag>
      </template>
      <template #description>
        <template v-if="checking">{{ t('appliance:channel-checking', { channel }) }}</template>
        <template v-else>{{ t('appliance:channel', { channel }) }}</template>
      </template>
    </UiCardTitle>

    <template v-if="upgrade !== undefined">
      <ApplianceUpgradeProgress :upgrade />
      <VtsDivider type="stretch" />
      <div class="install">
        <ApplianceUpgradeButton :channel :current-version :next-version busy />
        <span class="warning typo-body-regular-small">{{ t('appliance:install-also-in-tasks') }}</span>
      </div>
    </template>

    <div v-else-if="checking" class="checking typo-body-bold" role="status">
      <UiLoader class="loader" />
      {{ t('appliance:checking-for-updates') }}
    </div>

    <template v-else-if="registered && !hasUpdates">
      <VtsStateHero format="card" horizontal size="small" type="all-done">
        {{ t('appliance:on-latest-version') }}
      </VtsStateHero>
      <VtsCardRowKeyValue>
        <template #key>{{ t('version') }}</template>
        <template v-if="currentVersion !== undefined" #value>{{ currentVersion }}</template>
      </VtsCardRowKeyValue>
    </template>

    <template v-else>
      <div class="versions">
        <ApplianceVersionBlock :label="t('appliance:you-run')" :version="installedVersionLabel" variant="neutral" />
        <VtsIcon class="arrow" name="fa:arrow-right" size="medium" />
        <ApplianceVersionBlock
          v-if="nextVersion === undefined"
          :detail="unknownNextVersionDetail"
          :label="t('appliance:next-version')"
          :version="t('unknown')"
          variant="unknown"
        />
        <ApplianceVersionBlock
          v-else
          :detail="t('appliance:channel', { channel })"
          :label="t('appliance:next-version')"
          :version="nextVersion"
          variant="highlighted"
        />
      </div>

      <UiInfo v-if="registered === false" accent="warning">
        {{ t('appliance:updates-blocked-until-registered') }}
      </UiInfo>

      <template v-else>
        <div class="whats-new">
          <span class="typo-body-bold">{{ t('appliance:whats-new') }}</span>
          <div class="links">
            <UiLink :href="XO_LINKS.BLOG" size="small">
              {{ t('appliance:blog-post') }}
            </UiLink>
            <UiLink :href="XO_LINKS.CHANGELOG" size="small">
              {{ t('appliance:changelog') }}
            </UiLink>
          </div>
        </div>

        <VtsDivider type="stretch" />

        <div class="install">
          <ApplianceUpgradeButton :channel :current-version :next-version @upgraded="emit('upgraded')" />
          <span class="warning typo-body-regular-small">{{ t('appliance:restart-interrupts-warning') }}</span>
        </div>
      </template>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import ApplianceUpgradeButton from '@/modules/appliance/components/actions/upgrade/ApplianceUpgradeButton.vue'
import ApplianceUpgradeProgress from '@/modules/appliance/components/version/ApplianceUpgradeProgress.vue'
import ApplianceVersionBlock from '@/modules/appliance/components/version/ApplianceVersionBlock.vue'
import type { ApplianceUpgrade } from '@/modules/appliance/types/appliance-upgrade.type.ts'
import { XO_LINKS } from '@/shared/constants.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { currentVersion, registered } = defineProps<{
  channel: string
  checking: boolean
  hasUpdates: boolean
  registered?: boolean
  currentVersion?: string
  nextVersion?: string
  upgrade?: ApplianceUpgrade
}>()

const emit = defineEmits<{
  upgraded: []
}>()

const { t } = useI18n()

const installedVersionLabel = computed(() => {
  if (currentVersion === undefined) {
    return '-'
  }

  return currentVersion
})

const unknownNextVersionDetail = computed(() => {
  if (registered === false) {
    return t('appliance:register-to-check-updates')
  }

  return undefined
})
</script>

<style lang="postcss" scoped>
.appliance-version-card {
  .checking {
    display: flex;
    align-items: center;
    gap: 1.6rem;

    .loader {
      color: var(--color-brand-txt-base);
    }
  }

  .versions {
    display: flex;
    align-items: stretch;
    gap: 1.6rem;

    .arrow {
      align-self: center;
      color: var(--color-brand-txt-base);
    }
  }

  .whats-new {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;

    .links {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.8rem;
    }
  }

  .install {
    display: flex;
    align-items: center;
    gap: 1.6rem;

    .warning {
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
