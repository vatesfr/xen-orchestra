<template>
  <UiDrawer @confirm="confirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ title }}
    </template>

    <template #content>
      <div class="content">
        <UsersSelectionTable v-model:selected-user-ids="selectedUserIds" :users />
        <UiInfo v-if="isSelectionErrorVisible" accent="danger">
          {{ t('select-at-least-one-user.') }}
        </UiInfo>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:add') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import UsersSelectionTable from '@/modules/user/components/drawer/UsersSelectionTable.vue'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { users } = defineProps<{
  users: FrontXoUser[]
  title: string
}>()

const emit = defineEmits<{
  confirm: [users: FrontXoUser[]]
  cancel: []
}>()

const { t } = useI18n()

const selectedUserIds = ref<FrontXoUser['id'][]>([])

const hasTriedToConfirm = ref(false)

const isSelectionErrorVisible = computed(() => hasTriedToConfirm.value && selectedUserIds.value.length === 0)

function confirm() {
  hasTriedToConfirm.value = true

  if (selectedUserIds.value.length === 0) {
    return
  }

  emit(
    'confirm',
    users.filter(user => selectedUserIds.value.includes(user.id))
  )
}
</script>

<style lang="postcss" scoped>
.content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
