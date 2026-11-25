<template>
  <UiDrawer class="pool-existing-host-drawer" @confirm="onConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('existing-host') }}
    </template>

    <template #content>
      <div class="content">
        <FormSelect v-bind="hostSelectBindings" />
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />

      <VtsOverlayConfirmButton>
        {{ t('action:add-host') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { usePoolExistingHostForm } from '@/modules/pool/form/use-pool-existing-host-form.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import FormSelect from '@/shared/components/form/FormSelect.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useI18n } from 'vue-i18n'

const { poolId } = defineProps<{
  poolId: FrontXoPool['id']
}>()

const emit = defineEmits<{
  confirm: [hostId: FrontXoHost['id'] | undefined]
  cancel: []
}>()

const { t } = useI18n()

const { hostSelectBindings, validateAndGetHostId } = usePoolExistingHostForm(() => poolId)

async function onConfirm() {
  emit('confirm', await validateAndGetHostId())
}
</script>

<style lang="postcss" scoped>
.pool-existing-host-drawer {
  .content {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    text-align: left;
  }
}
</style>
