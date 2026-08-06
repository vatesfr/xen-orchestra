<template>
  <UiModal accent="info" icon="object:vm" @confirm="emit('close')" @dismiss="emit('close')">
    <template #title>
      {{ t('action:export-n-vms-manually', { n: labelWithUrl.length }) }}
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
      <VtsOverlayConfirmButton>{{ t('action:close') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { blockedUrls } = defineProps<{
  blockedUrls: URL[]
}>()

const emit = defineEmits<{
  close: []
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
