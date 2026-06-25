<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isSmall }">
    <template #header>
      <div :class="{ 'close-button': uiStore.isSmall }">
        <UiButtonIcon
          v-tooltip="t('action:close')"
          size="small"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isSmall ? 'fa:angle-left' : 'fa:close'"
          @click="emit('close')"
        />
      </div>
    </template>
    <template #default>
      <UserInfosCard :user />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import UserInfosCard from '@/modules/user/components/list/panel/cards/UserInfosCard.vue'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: FrontXoUser
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const uiStore = useUiStore()
</script>

<style scoped lang="postcss">
.action-buttons {
  display: flex;
  align-items: center;
  margin-inline-end: auto;
}

.mobile-drawer {
  position: fixed;
  inset: 0;

  .close-button {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
