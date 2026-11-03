<template>
  <VtsSidePanel :has-selection="vm !== undefined" @close="emit('close')">
    <template v-if="vm" #actions>
      <V2vNewVmActions v-if="vm.kind === 'new'" :vm :update-vm @remove="id => emit('remove', id)" />
      <V2vResumedVmActions v-else-if="vm.kind === 'resume'" :vm />
      <V2vNotFoundVmActions v-else :vm @remove="id => emit('remove', id)" />
    </template>
    <template v-if="vm" #default>
      <V2vVmHeadingCard :id="vm.id" :heading="vm.heading" />
      <V2vNewVmCards v-if="vm.kind === 'new'" :vm :update-vm />
      <V2vResumedVmCards v-else-if="vm.kind === 'resume'" :vm />
      <VtsStateHero v-else format="panel" type="not-found" size="medium">
        {{ t('v2v:not-found-in-source') }}
      </VtsStateHero>
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import V2vNewVmActions from '@/modules/v2v/components/panel/V2vNewVmActions.vue'
import V2vNewVmCards from '@/modules/v2v/components/panel/V2vNewVmCards.vue'
import V2vNotFoundVmActions from '@/modules/v2v/components/panel/V2vNotFoundVmActions.vue'
import V2vResumedVmActions from '@/modules/v2v/components/panel/V2vResumedVmActions.vue'
import V2vResumedVmCards from '@/modules/v2v/components/panel/V2vResumedVmCards.vue'
import V2vVmHeadingCard from '@/modules/v2v/components/panel/V2vVmHeadingCard.vue'
import type { V2vMappingStepVm } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import type { V2vVmMappingContext } from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import type { XoV2vVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

// Each kind has its own actions and cards, for each runs its own composables: the kind of the VM changes once the
// import VM of a resumed VM is deleted, and the panel then shows the new VM it became
defineProps<{
  vm?: V2vMappingStepVm
  updateVm: V2vVmMappingContext['updateVm']
}>()

const emit = defineEmits<{
  close: []
  remove: [id: XoV2vVm['id']]
}>()

const { t } = useI18n()
</script>
