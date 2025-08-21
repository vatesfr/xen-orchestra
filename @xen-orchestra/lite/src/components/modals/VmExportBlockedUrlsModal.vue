<template>
  <VtsModal accent="info" icon="fa:display">
    <template #title>
      {{ t('export-n-vms-manually', { n: labelWithUrl.length }) }}
    </template>
    <template #content>
      <p class="export-information">
        {{ t('export-vms-manually-information') }}
      </p>

      <ul class="list">
        <li v-for="({ url, label }, index) in labelWithUrl" :key="index">
          <a :href="url.href" rel="noopener noreferrer" target="_blank">
            {{ label }}
          </a>
        </li>
      </ul>
    </template>

    <template #buttons>
      <VtsModalConfirmButton>{{ t('close') }}</VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import type { XenApiVm } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { blockedUrls } = defineProps<{
  blockedUrls: URL[]
}>()

const { t } = useI18n()

const { getByOpaqueRef } = useVmStore().subscribe()

const labelWithUrl = computed(() =>
  blockedUrls.map(url => {
    const ref = url.searchParams.get('ref') as XenApiVm['$ref']
    return {
      url,
      label: getByOpaqueRef(ref)?.name_label ?? ref,
    }
  })
)
</script>

<style lang="postcss" scoped>
.export-information {
  max-width: 60rem;
  line-height: 2;
}
</style>
