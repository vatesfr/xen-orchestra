<template>
  <div class="breadcrumb-container">
    <UiBreadcrumb v-if="fromContext === 'vm' && vm" :size>
      <UiLink :size :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }">
        <VtsObjectIcon type="vm" :state="toLower(vm.power_state)" size="current" />
        {{ vm.name_label }}
      </UiLink>
      <UiLink :size :to="{ name: '/vm/[id]/vdis', params: { id: vm.id } }">
        {{ t('vdis') }}
      </UiLink>
      <span>
        {{ vdi.name_label }}
      </span>
    </UiBreadcrumb>

    <UiBreadcrumb v-if="fromContext === 'sr' && pool && sr" :size>
      <UiLink :size :to="{ name: '/pool/[id]/dashboard', params: { id: sr.$pool } }">
        <VtsIcon name="object:pool" size="medium" />
        {{ pool.name_label }}
      </UiLink>
      <UiLink :size :to="{ name: '/pool/[id]/storage', params: { id: sr.$pool } }">
        {{ t('storage') }}
      </UiLink>
      <span>
        {{ vdi.name_label }}
      </span>
    </UiBreadcrumb>

    <UiBreadcrumb v-if="fromContext === 'snapshot' && vm" :size>
      <UiLink :size :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }">
        <VtsObjectIcon type="vm" :state="toLower(vm.power_state)" size="current" />
        {{ vm.name_label }}
      </UiLink>
      <UiLink :size :to="{ name: '/vm/[id]/snapshots', params: { id: vm.id } }">
        {{ t('snapshots') }}
      </UiLink>
      <span>
        {{ vdi.name_label }}
      </span>
    </UiBreadcrumb>
  </div>
</template>

<script lang="ts" setup>
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.js'
import type { VdiPageContext } from '@/shared/constants.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import VtsObjectIcon from '@xen-orchestra/web-core/components/object-icon/VtsObjectIcon.vue'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm, sr, vdi, fromContext } = defineProps<{
  vm?: FrontXoVm
  sr?: FrontXoSr
  vdi: FrontXoVdi
  fromContext?: VdiPageContext
}>()

const uiStore = useUiStore()

const { t } = useI18n()

const { useGetPoolById } = useXoPoolCollection()
const pool = useGetPoolById(sr?.$pool)

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))
</script>
