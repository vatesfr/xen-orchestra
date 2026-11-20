<template>
  <UiDrawer class="vm-partial-deletion-drawer" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      {{ t('partial-deletion') }}
    </template>

    <template #content>
      <div class="partial-deletion">
        <div class="summary">
          <p class="typo-body-bold">{{ t('n-vms-protected-against-deletion', { n: protectedVms.length }) }}</p>
          <p class="typo-body-bold">
            {{ t('only-n-of-total-vms-will-be-deleted', { n: deletableVms.length, total: totalCount }) }}
          </p>
        </div>
        <p class="info">{{ t('protected-vms-delete-info', { n: protectedVms.length }) }}</p>
        <div>
          <TabList>
            <UiTabItem v-bind="tabs.deletable.bindings">{{ t('deletable-vms') }}</UiTabItem>
            <UiTabItem v-bind="tabs.protected.bindings">{{ t('protected-vms') }}</UiTabItem>
          </TabList>
          <VmPartialDeletionTable :key="currentTab" :vms="displayedVms" />
        </div>
        <p class="info">{{ t('are-you-sure-to-continue') }}</p>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:delete-n-vms', { n: deletableVms.length }) }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import VmPartialDeletionTable from '@/modules/vm/components/drawer/VmPartialDeletionTable.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import TabList from '@core/components/tab-list/TabList.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { useTabList } from '@core/composables/tab-list.composable.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

type PartialDeletionTab = 'deletable' | 'protected'

const { deletableVms, protectedVms } = defineProps<{
  deletableVms: FrontXoVm[]
  protectedVms: FrontXoVm[]
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

const { currentTab, tabs } = useTabList<PartialDeletionTab>(['deletable', 'protected'], ref('deletable'))

const totalCount = computed(() => deletableVms.length + protectedVms.length)

const displayedVms = computed(() => (currentTab.value === 'protected' ? protectedVms : deletableVms))
</script>

<style lang="postcss" scoped>
.vm-partial-deletion-drawer {
  .partial-deletion,
  .summary {
    display: flex;
    flex-direction: column;
  }

  .partial-deletion {
    gap: 2.4rem;
  }

  .summary {
    gap: 0.8rem;
  }

  .info {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
