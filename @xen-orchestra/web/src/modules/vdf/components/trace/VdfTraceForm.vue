<template>
  <form class="form" @submit.prevent="submit()">
    <div class="end">
      <VtsInputWrapper :label="t('firewall:trace:from')">
        <VtsSelect :id="fromSelectId" accent="brand" />
      </VtsInputWrapper>
      <VtsInputWrapper v-if="form.from === EXTERNAL" :label="t('firewall:trace:external-ip')">
        <UiInput v-model.trim="form.fromIp" accent="brand" placeholder="192.168.1.30" />
      </VtsInputWrapper>
    </div>
    <VtsIcon name="fa:arrow-right" size="medium" class="arrow" />
    <div class="end">
      <VtsInputWrapper :label="t('firewall:trace:to')">
        <VtsSelect :id="toSelectId" accent="brand" />
      </VtsInputWrapper>
      <VtsInputWrapper v-if="form.to === EXTERNAL" :label="t('firewall:trace:external-ip')">
        <UiInput v-model.trim="form.toIp" accent="brand" placeholder="203.0.113.10" />
      </VtsInputWrapper>
    </div>
    <VtsInputWrapper :label="t('firewall:rule-form:protocol')" class="small">
      <VtsSelect :id="protoSelectId" accent="brand" />
    </VtsInputWrapper>
    <VtsInputWrapper v-if="hasPort" :label="t('firewall:trace:port')" class="small">
      <UiInput v-model.number="form.port" accent="brand" type="number" />
    </VtsInputWrapper>
    <VtsInputWrapper :label="t('firewall:trace:connection')" class="small">
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
  </form>
</template>

<script lang="ts" setup>
import type { VdfProtocol, VdfTraceRequest } from '@/modules/vdf/types.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, onMounted, reactive, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

// Mounted once the VMs are known: the selects only pick up the initial
// values from the options present at creation.
const { vms, initial } = defineProps<{
  vms: { id: string; label: string }[]
  initial: Record<string, string | undefined>
  busy: boolean
}>()

const emit = defineEmits<{
  trace: [request: VdfTraceRequest]
}>()

const { t } = useI18n()

const EXTERNAL = 'external'

const form = reactive({
  from: initial.from ?? '',
  fromIp: initial.fromip ?? '',
  to: initial.to ?? '',
  toIp: initial.toip ?? '',
  proto: (initial.proto ?? 'tcp') as VdfProtocol,
  port: initial.port === undefined ? 22 : Number(initial.port),
  state: (initial.state ?? 'new') as NonNullable<VdfTraceRequest['state']>,
  broadcast: false,
})

const endOptions = computed(() => [...vms, { id: EXTERNAL, label: t('firewall:trace:external-address') }])

const { id: fromSelectId } = useFormSelect(endOptions, {
  model: toRef(form, 'from'),
  searchable: true,
  required: true,
  option: { id: 'id', value: 'id', label: 'label' },
})

const { id: toSelectId } = useFormSelect(endOptions, {
  model: toRef(form, 'to'),
  searchable: true,
  required: true,
  option: { id: 'id', value: 'id', label: 'label' },
})

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
  [
    { value: 'new', label: t('firewall:trace:state:new') },
    { value: 'established', label: t('firewall:trace:state:established') },
    { value: 'revoked', label: t('firewall:trace:state:revoked') },
  ],
  { model: toRef(form, 'state'), required: true, option: { id: 'value', value: 'value', label: 'label' } }
)

const hasPort = computed(() => form.proto === 'tcp' || form.proto === 'udp')

const fromSpec = computed(() => (form.from === EXTERNAL ? form.fromIp : form.from))

const toSpec = computed(() => (form.to === EXTERNAL ? form.toIp : form.to))

const canTrace = computed(
  () => fromSpec.value !== '' && toSpec.value !== '' && (!hasPort.value || (form.port >= 1 && form.port <= 65535))
)

function submit() {
  if (!canTrace.value) {
    return
  }

  const request: VdfTraceRequest = { from: fromSpec.value, to: toSpec.value, proto: form.proto, state: form.state }

  if (hasPort.value) {
    request.port = form.port
  }

  // a UDP broadcast from the source: is it delivered to the destination?
  if (form.proto === 'udp' && form.broadcast) {
    request.broadcast = true
  }

  emit('trace', request)
}

// links from other screens ("why is this blocked?") trace right away
onMounted(() => {
  if (initial.run !== undefined) {
    submit()
  }
})
</script>

<style lang="postcss" scoped>
.form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1.6rem;
}

.end {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-width: 24rem;
}

.small {
  width: 20rem;
}

.arrow {
  margin-block-end: 1.2rem;
  color: var(--color-neutral-txt-secondary);
}

.broadcast {
  margin-block-end: 1.2rem;
}

.submit {
  margin-inline-start: auto;
}
</style>
