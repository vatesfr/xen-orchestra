<template>
  <VtsCardRowKeyValue>
    <template #key>
      {{ t('host') }}
    </template>
    <template #value>
      <UiLink v-if="host !== undefined" size="small" icon="fa:server" :to="`host/${host.id}/dashboard`">
        {{ host.name_label }}
      </UiLink>
    </template>
  </VtsCardRowKeyValue>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoPbd } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { pbd } = defineProps<{
  pbd: XoPbd
}>()

const { t } = useI18n()

const { useGetHostById } = useXoHostCollection()

const host = useGetHostById(() => pbd.host)
</script>
