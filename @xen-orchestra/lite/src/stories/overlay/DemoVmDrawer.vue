<template>
  <UiDrawer title="VM settings" @confirm="handleRename()" @dismiss="emit('dismiss')">
    <template #content>
      <div class="demo-vm-drawer-content">
        <p>
          Current name: <strong>{{ name }}</strong>
        </p>
        <p>"Rename…" opens a modal on top of this drawer, which itself opens a confirmation modal.</p>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('dismiss')">Close</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>Rename…</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'

const { name } = defineProps<{
  name: string
}>()

const emit = defineEmits<{
  rename: [newName: string]
  dismiss: []
}>()

const { open: openRenameModal } = useOverlay({
  component: () => import('@/stories/overlay/DemoRenameModal.vue'),
  events: {
    // Transforms the raw emitted value: the trimmed name becomes the payload
    onSubmit: (newName: string) => newName.trim(),
    onCancel: true,
  },
})

async function handleRename() {
  const response = await openRenameModal({ props: { name } })

  if (response.event === 'onSubmit') {
    emit('rename', response.payload)
  }
}
</script>

<style lang="postcss" scoped>
.demo-vm-drawer-content {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
