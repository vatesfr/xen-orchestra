<template>
  <VdfContentModal accent="info" size="medium" @confirm="emit('confirm', selectedVms)" @dismiss="emit('cancel')">
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
        <UiAlert v-else accent="warning">{{ t('firewall:add-vms:effect') }}</UiAlert>
        <!-- vdf#86: a monitored policy of the group an enforced one decides first for -->
        <UiAlert v-if="shadowTexts.length > 0" accent="warning">
          {{ t('firewall:add-vms:monitor-blind') }}
          <template #description>
            <ul class="shadows">
              <li v-for="text of shadowTexts" :key="text">{{ text }}</li>
            </ul>
          </template>
        </UiAlert>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('firewall:add-vms:confirm', { n: selectedVms.length }) }}
      </VtsOverlayConfirmButton>
    </template>
  </VdfContentModal>
</template>

<script lang="ts" setup>
import VdfContentModal from '@/modules/vdf/components/VdfContentModal.vue'
import { useVdfMonitorShadows } from '@/modules/vdf/composables/vdf-monitor-shadows.composable.ts'
import type { VdfDocument } from '@/modules/vdf/types.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  candidates,
  tags,
  isPublished = true,
  groupName,
  document,
} = defineProps<{
  group: string
  tags: string[]
  candidates: FrontXoVm[]
  // a group only in the draft: hosts don't know it until it's published
  isPublished?: boolean
  // the group's name in the pool's document (its draft), to tell the
  // monitored policies on it an enforced one decides first for (vdf#86)
  groupName?: string
  document?: VdfDocument
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

// the selected VMs, with the group's tags: where a monitored policy on the
// group won't see their traffic
const { shadowsIn, shadowText } = useVdfMonitorShadows()

const shadowTexts = computed(() => {
  if (document === undefined || groupName === undefined || selectedVms.value.length === 0) {
    return []
  }

  const onGroup = new Set(document.policies.filter(policy => policy.appliedTo === groupName).map(policy => policy.name))

  return shadowsIn(
    document,
    selectedVms.value.map(vm => ({ vm, tags: [...new Set([...vm.tags, ...tags])] }))
  )
    .filter(shadow => onGroup.has(shadow.policy))
    .map(shadowText)
})
</script>

<style lang="postcss" scoped>
.vdf-add-vms-modal {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .shadows {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-inline-start: 1.6rem;
    margin: 0;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
