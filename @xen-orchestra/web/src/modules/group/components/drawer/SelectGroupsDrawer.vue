<template>
  <UiDrawer @confirm="confirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ title }}
    </template>

    <template #content>
      <div class="content">
        <GroupsSelectionTable v-model:selected-group-ids="selectedGroupIds" :groups />
        <UiInfo v-if="isSelectionErrorVisible" accent="danger">
          {{ t('select-at-least-one-group.') }}
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
import GroupsSelectionTable from '@/modules/group/components/drawer/GroupsSelectionTable.vue'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { groups } = defineProps<{
  groups: FrontXoGroup[]
  title: string
}>()

const emit = defineEmits<{
  confirm: [groups: FrontXoGroup[]]
  cancel: []
}>()

const { t } = useI18n()

const selectedGroupIds = ref<FrontXoGroup['id'][]>([])

const hasTriedToConfirm = ref(false)

const isSelectionErrorVisible = computed(() => hasTriedToConfirm.value && selectedGroupIds.value.length === 0)

function confirm() {
  hasTriedToConfirm.value = true

  if (selectedGroupIds.value.length === 0) {
    return
  }

  emit(
    'confirm',
    groups.filter(group => selectedGroupIds.value.includes(group.id))
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
