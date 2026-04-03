<template>
  <UiHeadBar icon="fa:plus">
    {{ t('new-vif:add') }}
  </UiHeadBar>

  <div class="card-container">
    <UiCard>
      <UiTitle>{{ t('configuration') }}</UiTitle>
      <NewVifForm v-if="vm" :vm-id="vm.id" :pool-id="vm.$pool" :cancel-to="cancelRoute" @create="createVif" />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import NewVifForm from '@/modules/vif/components/form/new/NewVifForm.vue'
import type { NewVifPayload } from '@/modules/vif/form/new/use-new-vif-form.ts'
import { useXoVifCreateJob } from '@/modules/vif/jobs/xo-vif-create.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()

const vmId = computed(() => route.query.vmId as FrontXoVm['id'] | undefined)

const { getVmById } = useXoVmCollection()

const vm = computed(() => (vmId.value ? getVmById(vmId.value) : undefined))

const cancelRoute = computed(() =>
  vm.value ? { name: '/vm/[id]/networks', params: { id: vm.value.id } } : { name: '/(site)/dashboard' }
)

const formPayload = ref<NewVifPayload>()

const { canRun, run: create } = useXoVifCreateJob(formPayload)

async function createVif(payload: NewVifPayload) {
  formPayload.value = payload

  if (!canRun.value) {
    return
  }

  await create()

  if (vm.value) {
    await router.push({ name: '/vm/[id]/networks', params: { id: vm.value.id } })
  }
}
</script>

<style lang="postcss" scoped>
.card-container {
  padding: 0.8rem;
}
</style>
