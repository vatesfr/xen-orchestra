<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList v-if="displayedVdi">
      <VtsTabularKeyValueRow :label="t('name')" :value="displayedVdi.name_label" />
      <VtsTabularKeyValueRow :label="t('uuid')" :value="displayedVdi.uuid" />
      <VtsTabularKeyValueRow :label="t('description')" :value="displayedVdi.name_description" />

      <VtsTabularKeyValueRow :label="t('tags')">
        <template v-if="displayedVdi.tags.length > 0" #value>
          <UiTagsList>
            <VtsTag v-for="tag in displayedVdi.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
      </VtsTabularKeyValueRow>

      <VtsTabularKeyValueRow v-if="vdi" :label="t('status')">
        <template #value>
          <VtsStatus :status="isConnected ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED" />
        </template>
      </VtsTabularKeyValueRow>

      <VtsTabularKeyValueRow v-if="vdi" :label="t('device')" :value="vbd?.device ?? '-'" />

      <VtsTabularKeyValueRow v-if="vdiSnapshot" :label="t('vdi-snapshot-source')">
        <template v-if="vdiSnapshot.$snapshot_of" #value>
          <UiLink
            size="small"
            :to="{
              name: '/vdi/[id]/general',
              params: { id: vdiSnapshot.$snapshot_of },
              query: { from: VDI_PAGE_CONTEXT.SR },
            }"
            :icon="getVdiIcon(getVbdsByIds(vdiSourceVdiSnapshot?.$VBDs ?? []))"
          >
            {{ vdiSourceVdiSnapshot ? vdiSourceVdiSnapshot.name_label : vdiSnapshot.$snapshot_of }}
          </UiLink>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow v-if="vdiSnapshot" :label="t('vdi-snpashot-time')" :value="snapshotFormattedDate" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { type FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { getVdiIcon } from '@/modules/vdi/utils/xo-vdi.util.ts'
import { CONNECTION_STATUS, VDI_PAGE_CONTEXT } from '@/shared/constants.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vbd, vdiSnapshot } = defineProps<{
  vdi?: FrontXoVdi
  vbd?: FrontXoVbd
  vdiSnapshot?: FrontXoVdiSnapshot
}>()

const { t, d } = useI18n()

const { getVdiById } = useXoVdiCollection()
const { getVbdsByIds } = useXoVbdCollection()

const displayedVdi = computed(() => vdi ?? vdiSnapshot)

const isConnected = computed(() => (vdiSnapshot ? vdiSnapshot.$VBDs.length > 0 : (vbd?.attached ?? false)))

const vdiSourceVdiSnapshot = computed(() => {
  if (vdiSnapshot?.$snapshot_of) {
    return getVdiById(vdiSnapshot?.$snapshot_of)
  }
  return undefined
})

const snapshotFormattedDate = computed(() => {
  if (vdiSnapshot) {
    return d(vdiSnapshot.snapshot_time * 1000, { dateStyle: 'short', timeStyle: 'medium' })
  }
  return undefined
})
</script>
