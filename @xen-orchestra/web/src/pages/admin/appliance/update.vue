<template>
  <div class="scroll-container">
    <div class="appliance" :class="{ mobile: uiStore.isSmall }">
      <UiAlert v-if="!registered" accent="warning" class="full-width">
        <span class="typo-body-bold">{{ t('appliance:appliance-not-registered') }}</span>
        <template #description>{{ t('appliance:appliance-not-registered-description') }}</template>
      </UiAlert>
      <div class="column main">
        <ApplianceVersionCard
          :channel="channelLabel"
          :checking="isCheckingUpdates"
          :has-updates="hasUpdates"
          :current-version
          :next-version
          :registered
          :upgrade
          @upgraded="handleUpgraded()"
        />
      </div>
      <AppliancePackagesCard :packages class="full-width" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import AppliancePackagesCard from '@/modules/appliance/components/packages/AppliancePackagesCard.vue'
import ApplianceVersionCard from '@/modules/appliance/components/version/ApplianceVersionCard.vue'
import { useXoaUpgrade } from '@/modules/appliance/composables/use-xoa-upgrade.composable.ts'
import { useXoaPackages } from '@/modules/appliance/remote-resources/use-xoa-packages.ts'
import { useXoaUpdateChannel } from '@/modules/appliance/remote-resources/use-xoa-update-channel.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const uiStore = useUiStore()

const { t } = useI18n()

const { channel } = useXoaUpdateChannel()

const { packages, hasUpdates, currentVersion, nextVersion, isCheckingUpdates, hasCheckUpdatesError, checkUpdates } =
  useXoaPackages()

const { upgrade } = useXoaUpgrade()

function handleUpgraded() {
  checkUpdates()
}

// TEMP: en attendant une route d'enregistrement, le 409 de la vérification signifie « non enregistrée »
const registered = computed(() => !hasCheckUpdatesError.value)

const channelLabel = computed(() => {
  if (channel.value === undefined) {
    return t('unknown')
  }

  return channel.value
})
</script>

<style lang="postcss" scoped>
.scroll-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.appliance {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
  gap: 0.8rem;
  margin: 0.8rem;

  .column {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    min-width: 0;
  }

  .main {
    grid-column: span 2;
  }

  .full-width {
    grid-column: 1 / -1;
  }

  &.mobile {
    display: flex;
    flex-direction: column;
  }
}
</style>
