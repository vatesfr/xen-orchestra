<template>
  <UiModal>
    <FormModalLayout :icon="faDisplay">
      <template #title>
        {{ t('export-n-vms-manually', { n: labelWithUrl.length }) }}
      </template>

      <p>
        {{ t('export-vms-manually-information') }}
      </p>
      <ul class="list">
        <li v-for="({ url, label }, index) in labelWithUrl" :key="index">
          <a :href="url.href" rel="noopener noreferrer" target="_blank">
            {{ label }}
          </a>
        </li>
      </ul>

      <template #buttons>
        <ModalDeclineButton />
      </template>
    </FormModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import FormModalLayout from '@/components/ui/modals/layouts/FormModalLayout.vue'
import ModalDeclineButton from '@/components/ui/modals/ModalDeclineButton.vue'
import UiModal from '@/components/ui/modals/UiModal.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { faDisplay } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  blockedUrls: URL[]
}>()

const { t } = useI18n()

const { getByOpaqueRef } = useVmStore().subscribe()

const labelWithUrl = computed(() =>
  props.blockedUrls.map(url => {
    const ref = url.searchParams.get('ref') as XenApiVm['$ref']
    return {
      url,
      label: getByOpaqueRef(ref)?.name_label ?? ref,
    }
  })
)
</script>

<style lang="postcss" scoped>
.list {
  margin-top: 2rem;
}
</style>
