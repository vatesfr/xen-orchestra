<template>
  <UiModal accent="info" @confirm="handleSubmit()" @dismiss="emit('cancel')">
    <template #title>Rename VM</template>
    <template #content>
      <div class="demo-rename-modal-content">
        <VtsInputWrapper label="New name">
          <UiInput v-model.trim="newName" accent="brand" required />
        </VtsInputWrapper>
        <p>
          Tip: name the VM "fail" to make the fake API call fail: the confirmation modal closes and this modal stays
          open to pick another name.
        </p>
        <p v-if="hasRenameFailed" class="error">The rename failed. Try another name.</p>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>Save</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

const { name } = defineProps<{
  name: string
}>()

const emit = defineEmits<{
  submit: [newName: string]
  cancel: []
}>()

const newName = ref(name)

const hasRenameFailed = ref(false)

const { open: openConfirmModal } = useOverlay({
  component: () => import('@/stories/overlay/DemoConfirmModal.vue'),
  events: {
    onConfirm: true,
    onCancel: true,
  },
})

// Simulated API call, to showcase the busy state. Renaming to "fail" fails.
async function renameVm(value: string) {
  await new Promise(resolve => setTimeout(resolve, 1500))

  return value.toLowerCase() !== 'fail'
}

async function handleSubmit() {
  hasRenameFailed.value = false

  const response = await openConfirmModal({
    props: { currentName: name, newName: newName.value },
    events: {
      // Per-call async handler: the confirmation modal is busy while it runs,
      // then closes, and the API result becomes the response payload
      onConfirm: () => renameVm(newName.value),
    },
  })

  if (response.event !== 'onConfirm') {
    return
  }

  if (!response.payload) {
    hasRenameFailed.value = true

    return
  }

  emit('submit', newName.value)
}
</script>

<style lang="postcss" scoped>
.demo-rename-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .error {
    color: var(--color-danger-txt-base);
  }
}
</style>
