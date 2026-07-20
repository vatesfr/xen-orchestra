<template>
  <VtsModal accent="info" icon="status:info-picto" dismissible>
    <template #title>
      {{ t('vms-guest-tools-details') }}
    </template>

    <template #content>
      <div class="content">
        <div v-if="vmGuestToolsStatus.bestVersion !== undefined" class="best-version">
          <span class="typo-body-regular-small best-version-label">{{ t('best-version') }}</span>
          <code class="typo-body-bold">{{ vmGuestToolsStatus.bestVersion }}</code>
        </div>

        <div v-if="vmGuestToolsStatus.outOfDateVms.length > 0" class="section">
          <p class="section-title typo-body-bold">
            {{ t('out-of-date-n', { n: vmGuestToolsStatus.outOfDateVms.length }) }}
          </p>
          <VtsTabularKeyValueList>
            <VtsTabularKeyValueRow v-for="vm in vmGuestToolsStatus.outOfDateVms" :key="vm.id" :label="vm.name">
              <template #value>
                <code>{{ vm.version ?? t('unknown') }}</code>
              </template>
            </VtsTabularKeyValueRow>
          </VtsTabularKeyValueList>
        </div>

        <div v-if="vmGuestToolsStatus.missingVms.length > 0" class="section">
          <p class="section-title typo-body-bold">
            {{ t('missing-guest-tools-n', { n: vmGuestToolsStatus.missingVms.length }) }}
          </p>
          <ul class="vm-list">
            <li v-for="vm in vmGuestToolsStatus.missingVms" :key="vm.id" class="typo-body-regular-small">
              {{ vm.name }}
            </li>
          </ul>
        </div>

        <div v-if="vmGuestToolsStatus.unknownVms.length > 0" class="section">
          <p class="section-title typo-body-bold">
            {{ t('unknown-guest-tools-n', { n: vmGuestToolsStatus.unknownVms.length }) }}
          </p>
          <ul class="vm-list">
            <li v-for="vm in vmGuestToolsStatus.unknownVms" :key="vm.id" class="typo-body-regular-small">
              {{ vm.name }}
            </li>
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
import { useI18n } from 'vue-i18n'

defineEmits<{
  cancel: []
}>()

const { vmGuestToolsStatus } = useXoVmCollection()

const { t } = useI18n()
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
