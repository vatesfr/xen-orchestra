<template>
  <VtsErrorModal :title @close="emit('close')">
    <template #content>
      <div class="vm-migrate-error-modal-content">
        <span>{{ error }}</span>
        <UiLink
          v-if="taskId !== undefined"
          icon="object:task"
          size="medium"
          :to="{ name: '/vm/[id]/tasks', params: { id: vmId }, query: { id: taskId } }"
          @click="emit('close')"
        >
          {{ t('see-details') }}
        </UiLink>
      </div>
    </template>
  </VtsErrorModal>
</template>

<script lang="ts" setup>
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsErrorModal from '@core/components/modal/VtsErrorModal.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
  error: string
  vmId: FrontXoVm['id']
  taskId?: FrontXoTask['id']
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vm-migrate-error-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  overflow-wrap: anywhere;

  .ui-link {
    padding-block: 0.4rem;
  }
}
</style>
