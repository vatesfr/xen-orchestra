<template>
  <UiCard>
    <UiTitle>
      {{ t('configuration') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('format')" :value="displayedVdi?.image_format" />
      <VtsTabularKeyValueRow :label="t('storage')">
        <template v-if="sr" #value>
          <UiLink size="small" :href="srHref" :icon="srStatusIcon">
            {{ sr.name_label }}
          </UiLink>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow v-if="vdi" :label="t('change-block-tracking')">
        <template v-if="displayedVdi" #value>
          <VtsStatus :status="displayedVdi.cbt_enabled ? 'enabled' : 'disabled'" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow v-if="vdi" :label="t('operation:snapshot')">
        <template #value>
          <VtsStatus :status="isSnapshottingEnabled ? 'enabled' : 'disabled'" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vdiSnapshot } = defineProps<{ vdi?: FrontXoVdi; vdiSnapshot?: FrontXoVdiSnapshot }>()

const { t } = useI18n()

const { useGetSrById } = useXoSrCollection()
const { buildXo5Route } = useXoRoutes()

const displayedVdi = computed(() => vdi ?? vdiSnapshot)

const sr = useGetSrById(() => displayedVdi.value?.$SR)

const { srStatusIcon } = useXoSrUtils(sr)

const srHref = computed(() => (sr.value ? buildXo5Route(`/srs/${sr.value.id}/general`) : undefined))

const isSnapshottingEnabled = computed(() => (displayedVdi.value ? !displayedVdi.value.tags.includes('NOSNAP') : false))
</script>
