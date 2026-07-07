<template>
  <VtsSidePanel :has-selection="!!user" @close="emit('close')">
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
      <UserGroupsCard :user />
      <UserRolesCard />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import UserGroupsCard from '@/modules/user/components/list/panel/cards/UserGroupsCard.vue'
import UserInfosCard from '@/modules/user/components/list/panel/cards/UserInfosCard.vue'
import UserRolesCard from '@/modules/user/components/list/panel/cards/UserRolesCard.vue'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
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
