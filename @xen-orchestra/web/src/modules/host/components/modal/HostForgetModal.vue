<template>
  <VtsModal accent="warning" icon="status:warning-picto">
    <template #title>
      {{ t('host-forget-title') }}
    </template>

    <template #content>
      {{ t('host-forget-info') }}
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ t('action:forget') }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsModal from '@xen-orchestra/web-core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@xen-orchestra/web-core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@xen-orchestra/web-core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()
</script>
