<template>
  <UiCard>
    <UiTitle>
      {{ t('pbd-details') }}
    </UiTitle>
    <VtsStateHero v-if="!arePbdsReady" format="panel" type="busy" size="medium" />
    <VtsStateHero v-else-if="!pbds" type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-pbd-attached') }}
    </VtsStateHero>
    <div v-else class="content">
      <UiLogEntryViewer
        v-for="pbd in pbds"
        :key="pbd.id"
        class="log-viewer"
        :content="pbd"
        :label="t('device-config')"
        size="small"
        accent="info"
      />
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const { pbdsBySr, arePbdsReady } = useXoPbdCollection()

const pbds = computed(() => pbdsBySr.value.get(sr.id))
</script>

<style scoped lang="postcss">
.log-viewer:not(:last-child) {
  margin-block-end: 2rem;
}
</style>
