<template>
  <div class="breadcrumb-container">
    <UiBreadcrumb :size>
      <UiLink v-if="vm" :size :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }">
        <VtsObjectIcon type="vm" :state="vmPowerState" size="current" />
        {{ vm.name_label }}
      </UiLink>
      <UiLink v-if="vm" :size :to="{ name: '/vm/[id]/vdis', params: { id: vm.id } }">
        {{ t('vdis') }}
      </UiLink>
      <span v-if="vdi">
        {{ vdi.name_label }}
      </span>
    </UiBreadcrumb>
    <div v-if="vdi && vm && attachedVdb">
      <VdiHeader v-if="uiStore.hasUi" :vdi :vm :vbd="attachedVdb" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VdiHeader from '@/modules/vdi/VdiHeader.vue'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoVm } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute<'/vdi/[id]'>()
const uiStore = useUiStore()
const { t } = useI18n()

// On récupère les infos du VDI
const { useGetVdiById } = useXoVdiCollection()
const vdi = useGetVdiById(() => route.params.id as FrontXoVdi['id'])

// récupère les VDBs d'un VDI
const { useGetVbdsByIds } = useXoVbdCollection()
const vbds = useGetVbdsByIds(() => vdi.value?.$VBDs ?? [])

// On récupère le vdb (câble)
const attachedVdb = computed(() => vbds.value.find(vbd => vbd.attached))

// Enfin les infos de la VM
const { useGetVmById } = useXoVmCollection()
const vm = useGetVmById(() => attachedVdb.value?.VM as XoVm['id'])

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))
const vmPowerState = computed(() => toLower(vm.value?.power_state))
</script>
