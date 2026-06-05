<template>
  <UiCard>
    <UiTitle>
      {{ t('configuration') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('format')" :value="vdi.image_format" />
      <VtsTabularKeyValueRow :label="t('storage')">
        <template v-if="sr" #value>
          <UiLink size="small" :href="srHref" icon="object:sr">
            {{ sr.name_label }}
          </UiLink>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('change-block-tracking')">
        <template #value>
          <VtsStatus :status="vdi.cbt_enabled ? 'enabled' : 'disabled'" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('operation:snapshot')">
        <template #value>
          <VtsStatus :status="isSnapshottingEnabled ? 'enabled' : 'disabled'" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{ vdi: FrontXoVdi }>()

const { t } = useI18n()

const { useGetSrById } = useXoSrCollection()
const sr = useGetSrById(() => vdi.$SR)

const { buildXo5Route } = useXoRoutes()
const srHref = computed(() => (sr.value ? buildXo5Route(`/vms/${sr.value.id}/network`) : undefined))

const isSnapshottingEnabled = computed(() => !vdi.tags.includes('NOSNAP'))
</script>
