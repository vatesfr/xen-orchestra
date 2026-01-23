<template>
  <VtsCardRowKeyValue>
    <template #key>
      {{ t('host') }}
    </template>
    <template #value>
      <UiLink v-if="host !== undefined" size="small" icon="object:host" :to="`host/${host.id}/dashboard`">
        {{ host.name_label }}
      </UiLink>
    </template>
  </VtsCardRowKeyValue>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

const { pbd } = defineProps<{
  pbd: FrontXoPbd
}>()

const { t } = useI18n()

const { useGetHostById } = useXoHostCollection()

const host = useGetHostById(() => pbd.host)
</script>
