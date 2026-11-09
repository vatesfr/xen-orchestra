<template>
  <UiDrawer @confirm="confirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ title }}
    </template>

    <template #content>
      <div class="content">
        <RolesSelectionTable v-model:selected-role-ids="selectedRoleIds" :roles />
        <UiInfo v-if="isSelectionErrorVisible" accent="danger">
          {{ t('select-at-least-one-role.') }}
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
import RolesSelectionTable from '@/modules/role/components/drawer/RolesSelectionTable.vue'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { roles } = defineProps<{
  roles: FrontXoRole[]
  title: string
}>()

const emit = defineEmits<{
  confirm: [roles: FrontXoRole[]]
  cancel: []
}>()

const { t } = useI18n()

const selectedRoleIds = ref<FrontXoRole['id'][]>([])

const hasTriedToConfirm = ref(false)

const isSelectionErrorVisible = computed(() => hasTriedToConfirm.value && selectedRoleIds.value.length === 0)

function confirm() {
  hasTriedToConfirm.value = true

  if (selectedRoleIds.value.length === 0) {
    return
  }

  emit(
    'confirm',
    roles.filter(role => selectedRoleIds.value.includes(role.id))
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
