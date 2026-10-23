<template>
  <UiModal accent="info" icon="fa:object-group" @confirm="emit('confirm', selectedVms)" @dismiss="emit('cancel')">
    <template #title>{{ t('firewall:add-vms:title', { group }) }}</template>
    <template #content>
      <div class="vdf-add-vms-modal">
        <VtsInputWrapper :label="t('vms')">
          <VtsSelect :id="vmSelectId" accent="brand" />
        </VtsInputWrapper>
        <div class="tags typo-body-regular-small">
          <span>{{ t('firewall:add-vms:tags') }}</span>
          <UiTagsList>
            <VtsTag v-for="tag of tags" :key="tag" :value="tag" />
          </UiTagsList>
        </div>
        <UiAlert v-if="!isPublished" accent="info">{{ t('firewall:add-vms:not-published') }}</UiAlert>
        <UiAlert accent="warning">{{ t('firewall:add-vms:effect') }}</UiAlert>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('firewall:add-vms:confirm', { n: selectedVms.length }) }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { candidates, isPublished = true } = defineProps<{
  group: string
  tags: string[]
  candidates: FrontXoVm[]
  // a group only in the draft: hosts don't know it until it's published
  isPublished?: boolean
}>()

// confirming with no VM selected keeps the modal open
const emit = defineEmits<{
  confirm: [vms: FrontXoVm[]]
  cancel: []
}>()

const { t } = useI18n()

const selectedIds = ref<string[]>([])

const { id: vmSelectId } = useFormSelect(() => candidates, {
  model: selectedIds,
  multiple: true,
  searchable: true,
  option: { id: 'id', value: 'id', label: 'name_label' },
})

const selectedVms = computed(() => candidates.filter(vm => selectedIds.value.includes(vm.id)))
</script>

<style lang="postcss" scoped>
.vdf-add-vms-modal {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  min-width: min(56rem, 80vw);
  text-align: start;

  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
