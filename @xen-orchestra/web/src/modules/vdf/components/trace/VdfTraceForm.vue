<template>
  <form class="vdf-trace-form" @submit.prevent="submit()">
    <div class="fields">
      <div class="end">
        <VtsInputWrapper :label="t('firewall:trace:from')" class="end-select">
          <VtsSelect :id="fromSelectId" accent="brand" />
        </VtsInputWrapper>
        <VtsInputWrapper v-if="form.from === EXTERNAL" :label="t('firewall:trace:external-ip')" class="ip">
          <UiInput
            v-model.trim="form.fromIp"
            accent="brand"
            :placeholder="t('firewall:trace:external-ip:placeholder')"
          />
        </VtsInputWrapper>
      </div>
      <VtsIcon name="fa:arrow-right" size="medium" class="arrow" />
      <div class="end">
        <VtsInputWrapper :label="t('firewall:trace:to')" class="end-select">
          <VtsSelect :id="toSelectId" accent="brand" />
        </VtsInputWrapper>
        <VtsInputWrapper v-if="form.to === EXTERNAL" :label="t('firewall:trace:external-ip')" class="ip">
          <UiInput v-model.trim="form.toIp" accent="brand" :placeholder="t('firewall:trace:external-ip:placeholder')" />
        </VtsInputWrapper>
      </div>
      <VtsInputWrapper :label="t('firewall:rule-form:protocol')" class="proto">
        <VtsSelect :id="protoSelectId" accent="brand" />
      </VtsInputWrapper>
      <VtsInputWrapper v-if="hasPort" :label="t('firewall:trace:port')" class="port">
        <UiInput v-model.number="form.port" accent="brand" type="number" />
      </VtsInputWrapper>
      <VtsInputWrapper :label="t('firewall:trace:connection')" class="state">
        <VtsSelect :id="stateSelectId" accent="brand" />
      </VtsInputWrapper>
      <UiCheckbox v-if="form.proto === 'udp'" v-model="form.broadcast" accent="brand" class="broadcast">
        {{ t('firewall:trace:broadcast') }}
      </UiCheckbox>
      <UiButton
        type="submit"
        variant="primary"
        accent="brand"
        size="medium"
        left-icon="fa:route"
        :busy
        :disabled="!canTrace"
        class="submit"
      >
        {{ t('firewall:trace:run') }}
      </UiButton>
    </div>
    <UiInfo v-for="vm of haltedEnds" :key="vm.id" accent="warning" wrap>
      {{ t('firewall:trace:vm-not-running', { vm: vm.name }) }}
    </UiInfo>
  </form>
</template>

<script lang="ts" setup>
import type { VdfProtocol, VdfTraceRequest } from '@/modules/vdf/types.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, nextTick, onMounted, reactive, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type VdfTraceVmOption = { id: string; name: string; running: boolean }

// The form's state as a route query (also what the rule log, Live and the
// overview link to): a trace can be shared, reloaded and prefilled.
export type VdfTraceQuery = {
  from?: string
  fromip?: string
  to?: string
  toip?: string
  proto?: string
  port?: string
  state?: string
  broadcast?: string
  run?: string
}

// Mounted once the VMs are known: the selects only pick up the initial
// values from the options present at creation.
const { vms, initial } = defineProps<{
  vms: VdfTraceVmOption[]
  initial: VdfTraceQuery
  busy: boolean
}>()

const emit = defineEmits<{
  trace: [request: VdfTraceRequest, query: VdfTraceQuery]
}>()

const { t } = useI18n()

const EXTERNAL = 'external'

const PROTOCOLS: VdfProtocol[] = ['tcp', 'udp', 'icmp', 'any']

const STATES: NonNullable<VdfTraceRequest['state']>[] = ['new', 'established', 'revoked']

const form = reactive({
  from: initial.from ?? '',
  fromIp: initial.fromip ?? '',
  to: initial.to ?? '',
  toIp: initial.toip ?? '',
  proto: PROTOCOLS.includes(initial.proto as VdfProtocol) ? (initial.proto as VdfProtocol) : 'tcp',
  port: initial.port === undefined ? 22 : Number(initial.port),
  state: STATES.includes(initial.state as never) ? (initial.state as NonNullable<VdfTraceRequest['state']>) : 'new',
  broadcast: initial.broadcast === '1',
})

// a halted VM is listed, but receives and sends nothing to trace
const endOptions = computed(() => [
  ...vms.map(vm => ({
    id: vm.id,
    label: vm.running ? vm.name : t('firewall:trace:vm-halted', { vm: vm.name }),
    disabled: !vm.running,
  })),
  { id: EXTERNAL, label: t('firewall:trace:external-address'), disabled: false },
])

const { id: fromSelectId } = useFormSelect(endOptions, {
  model: toRef(form, 'from'),
  searchable: true,
  required: true,
  placeholder: t('firewall:trace:end:placeholder'),
  option: { id: 'id', value: 'id', label: 'label', disabled: option => option.disabled },
})

const { id: toSelectId } = useFormSelect(endOptions, {
  model: toRef(form, 'to'),
  searchable: true,
  required: true,
  placeholder: t('firewall:trace:end:placeholder'),
  option: { id: 'id', value: 'id', label: 'label', disabled: option => option.disabled },
})

// a select only flags the options it holds when its model changes: when the
// VMs show up after mount (prefilled from a link), select the ends again
watch(
  () => vms.map(vm => vm.id).join(),
  async () => {
    const { from, to } = form

    form.from = ''
    form.to = ''
    await nextTick()
    form.from = from
    form.to = to
  }
)

const { id: protoSelectId } = useFormSelect(
  [
    { value: 'tcp', label: 'TCP' },
    { value: 'udp', label: 'UDP' },
    { value: 'icmp', label: 'ICMP' },
    { value: 'any', label: t('firewall:any-protocol') },
  ],
  { model: toRef(form, 'proto'), required: true, option: { id: 'value', value: 'value', label: 'label' } }
)

const { id: stateSelectId } = useFormSelect(
  STATES.map(value => ({ value, label: t(`firewall:trace:state:${value}`) })),
  { model: toRef(form, 'state'), required: true, option: { id: 'value', value: 'value', label: 'label' } }
)

const hasPort = computed(() => form.proto === 'tcp' || form.proto === 'udp')

const haltedEnds = computed(() =>
  [form.from, form.to]
    .map(id => vms.find(vm => vm.id === id))
    .filter((vm): vm is VdfTraceVmOption => vm !== undefined && !vm.running)
    .filter((vm, index, list) => list.indexOf(vm) === index)
)

const fromSpec = computed(() => (form.from === EXTERNAL ? form.fromIp : form.from))

const toSpec = computed(() => (form.to === EXTERNAL ? form.toIp : form.to))

const canTrace = computed(
  () =>
    fromSpec.value !== '' &&
    toSpec.value !== '' &&
    haltedEnds.value.length === 0 &&
    (!hasPort.value || (form.port >= 1 && form.port <= 65535))
)

function submit() {
  if (!canTrace.value) {
    return
  }

  const request: VdfTraceRequest = { from: fromSpec.value, to: toSpec.value, proto: form.proto, state: form.state }

  const query: VdfTraceQuery = {
    from: form.from,
    fromip: form.from === EXTERNAL ? form.fromIp : undefined,
    to: form.to,
    toip: form.to === EXTERNAL ? form.toIp : undefined,
    proto: form.proto,
    state: form.state === 'new' ? undefined : form.state,
    run: '1',
  }

  if (hasPort.value) {
    request.port = form.port
    query.port = String(form.port)
  }

  // a UDP broadcast from the source: is it delivered to the destination?
  if (form.proto === 'udp' && form.broadcast) {
    request.broadcast = true
    query.broadcast = '1'
  }

  emit('trace', request, query)
}

// links from other screens ("why is this dropped?") trace right away
onMounted(() => {
  if (initial.run !== undefined) {
    submit()
  }
})
</script>

<style lang="postcss" scoped>
.vdf-trace-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .fields {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 1.6rem;
  }

  .end {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.8rem;
  }

  .end-select {
    width: 24rem;
  }

  .ip {
    width: 16rem;
  }

  .proto {
    width: 14rem;
  }

  .port {
    width: 10rem;
  }

  .state {
    width: 22rem;
  }

  .arrow {
    margin-block-end: 1.2rem;
    color: var(--color-neutral-txt-secondary);
  }

  .broadcast {
    margin-block-end: 1.2rem;
  }
}
</style>
