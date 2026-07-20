<template>
  <VtsModal accent="info" icon="status:info-picto" dismissible>
    <template #title>
      {{ t('vms-guest-tools-details') }}
    </template>

    <template #content>
      <div class="content">
        <div v-if="bestVersion !== undefined" class="best-version">
          <span class="typo-body-regular-small best-version-label">{{ t('best-version') }}</span>
          <code class="typo-body-bold">{{ bestVersion }}</code>
        </div>

        <div v-if="outOfDateVms.length > 0" class="section">
          <p class="section-title typo-body-bold">{{ t('out-of-date-n', { n: outOfDateVms.length }) }}</p>
          <VtsTabularKeyValueList>
            <VtsTabularKeyValueRow v-for="vm in outOfDateVms" :key="vm.id" :label="vm.name">
              <template #value>
                <code>{{ vm.version ?? t('unknown') }}</code>
              </template>
            </VtsTabularKeyValueRow>
          </VtsTabularKeyValueList>
        </div>

        <div v-if="missingVms.length > 0" class="section">
          <p class="section-title typo-body-bold">{{ t('missing-guest-tools-n', { n: missingVms.length }) }}</p>
          <ul class="vm-list">
            <li v-for="vm in missingVms" :key="vm.id" class="typo-body-regular-small">{{ vm.name }}</li>
          </ul>
        </div>

        <div v-if="unknownVms.length > 0" class="section">
          <p class="section-title typo-body-bold">{{ t('unknown-guest-tools-n', { n: unknownVms.length }) }}</p>
          <ul class="vm-list">
            <li v-for="vm in unknownVms" :key="vm.id" class="typo-body-regular-small">{{ vm.name }}</li>
          </ul>
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:close') }}</VtsModalCancelButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineEmits<{
  cancel: []
}>()

const { runningVms, vmGuestToolsStatus } = useXoVmCollection()

const { t } = useI18n()

const bestVersion = computed(() => vmGuestToolsStatus.value.bestVersion)

const outOfDateVms = computed(() =>
  runningVms.value
    .filter(vm => vm.managementAgentDetected && vm.pvDriversDetected && vm.pvDriversUpToDate === false)
    .map(vm => ({ id: vm.id, name: vm.name_label, version: vm.pvDriversVersion }))
)

const missingVms = computed(() =>
  runningVms.value.filter(vm => !vm.managementAgentDetected).map(vm => ({ id: vm.id, name: vm.name_label }))
)

const unknownVms = computed(() =>
  runningVms.value
    .filter(vm => vm.managementAgentDetected && vm.pvDriversDetected && vm.pvDriversUpToDate === undefined)
    .map(vm => ({ id: vm.id, name: vm.name_label }))
)
</script>

<style lang="postcss" scoped>
.content {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}

.best-version {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.best-version-label {
  color: var(--color-neutral-txt-secondary);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.section-title {
  color: var(--color-neutral-txt-primary);
}

.vm-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0;
  list-style: none;
  color: var(--color-neutral-txt-primary);
}
</style>
