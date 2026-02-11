<template>
  <UiCard class="host-dashboard-cpu-provisioning">
    <UiCardTitle>{{ t('cpu-provisioning') }}</UiCardTitle>
    <VtsStateHero v-if="!isReady" format="card" type="busy" size="medium" />
    <template v-else>
      <VtsProgressBar
        :label="t('vcpus')"
        :total="cpusCount ?? vCpusCount"
        :thresholds="cpuProgressThresholds(t('cpu-provisioning-warning'))"
        :current="vCpusCount"
        legend-type="percent"
      />
      <div class="total">
        <UiCardNumbers :label="t('vcpus-assigned')" :value="vCpusCount" size="medium" />
        <UiCardNumbers :label="t('total-cpus')" :value="cpusCount" size="medium" />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { cpuProgressThresholds } from '@core/utils/progress.util.ts'
import { VM_POWER_STATE, type XoHost } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { useArrayReduce } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { areHostsReady } = useXoHostCollection()

const { vmsByHost, areVmsReady } = useXoVmCollection()

const isReady = logicAnd(areHostsReady, areVmsReady)

const hostVms = computed(() => vmsByHost.value.get(host.id) ?? [])

const cpusCount = computed(() => host.cpus.cores ?? 0)

const runningVms = computed(() => hostVms.value.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING))

const vCpusCount = useArrayReduce(runningVms, (total, vm) => total + vm.CPUs.number, 0)
</script>

<style lang="postcss" scoped>
.host-dashboard-cpu-provisioning {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
