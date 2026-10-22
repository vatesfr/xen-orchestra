<template>
  <UiDrawer :title @confirm="submit()" @dismiss="emit('cancel')">
    <template #content>
      <div class="vdf-rule-drawer">
        <UiInfo accent="info" wrap>{{ t('firewall:rule-form:context', { id: rule.id, policy: policyName }) }}</UiInfo>

        <UiRadioButtonGroup :label="t('firewall:rule-form:action')" accent="brand" gap="wide">
          <UiRadioButton v-for="action of actions" :key="action" v-model="form.action" :value="action" accent="brand">
            <VdfActionTag :action />
          </UiRadioButton>
        </UiRadioButtonGroup>
        <UiInfo accent="muted" wrap>{{ t(`firewall:rule-form:action:${form.action}`) }}</UiInfo>

        <VtsInputWrapper :label="t('firewall:rule-form:source')" :message="sourceMessage" wrap-message>
          <VtsSelect :id="sourceSelectId" accent="brand" />
        </VtsInputWrapper>

        <div class="row">
          <VtsInputWrapper :label="t('firewall:rule-form:protocol')">
            <VtsSelect :id="protocolSelectId" accent="brand" />
          </VtsInputWrapper>
          <VtsInputWrapper
            v-if="hasPorts"
            :label="t('firewall:rule-form:ports')"
            :message="portsError ?? t('firewall:rule-form:ports:info')"
            wrap-message
          >
            <UiInput v-model.trim="form.ports" :accent="portsError ? 'danger' : 'brand'" placeholder="443, 8080" />
          </VtsInputWrapper>
        </div>

        <UiToggle v-model="form.log">{{ t('firewall:rule-form:log') }}</UiToggle>
        <UiInfo v-if="form.action === 'pass' && form.log" accent="warning" wrap>
          {{ t('firewall:rule-form:log:pass') }}
        </UiInfo>
        <VtsInputWrapper v-if="form.log" :label="t('firewall:rule-form:log-label')">
          <UiInput v-model.trim="form.logLabel" accent="brand" placeholder="web-to-app" />
        </VtsInputWrapper>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('firewall:save-to-draft') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import type { VdfProtocol, VdfRule, VdfRuleAction } from '@/modules/vdf/types.ts'
import { formatPorts, parsePorts, ruleAction } from '@/modules/vdf/utils/vdf-policy.util.ts'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { useFormSelect } from '@core/packages/form-select'
import { omit } from 'lodash-es'
import { computed, reactive, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { rule, isNew, groups } = defineProps<{
  policyName: string
  rule: VdfRule
  isNew: boolean
  groups: { name: string; members: number }[]
}>()

const emit = defineEmits<{
  confirm: [rule: VdfRule]
  cancel: []
}>()

const { t } = useI18n()

const title = computed(() => (isNew ? t('firewall:rule-form:new') : t('firewall:rule-form:edit', { id: rule.id })))

const actions: VdfRuleAction[] = ['allow', 'drop', 'pass']

const form = reactive({
  action: ruleAction(rule),
  from: rule.from,
  proto: rule.proto,
  ports: formatPorts(rule.ports),
  log: rule.log ?? false,
  logLabel: rule.logLabel ?? '',
})

const { id: sourceSelectId } = useFormSelect([{ name: 'any', members: -1 }, ...groups], {
  model: toRef(form, 'from'),
  required: true,
  searchable: true,
  option: {
    id: 'name',
    value: 'name',
    label: group =>
      group.members === -1
        ? t('firewall:rule-form:source:any')
        : `${group.name} (${t('firewall:group:members', { n: group.members })})`,
  },
})

const protocols: { value: VdfProtocol; label: string }[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'icmp', label: 'ICMP' },
  { value: 'any', label: t('firewall:rule-form:protocol:any') },
]

const { id: protocolSelectId } = useFormSelect(protocols, {
  model: toRef(form, 'proto'),
  required: true,
  option: { id: 'value', value: 'value', label: 'label' },
})

const hasPorts = computed(() => form.proto === 'tcp' || form.proto === 'udp')

const sourceMessage = computed<InputWrapperMessage | undefined>(() =>
  form.from === 'any' ? t('firewall:rule-form:source:any:info') : undefined
)

const submitted = ref(false)

const parsedPorts = computed(() => parsePorts(form.ports))

const portsError = computed(() =>
  submitted.value && hasPorts.value && parsedPorts.value === undefined
    ? t('firewall:rule-form:ports:invalid')
    : undefined
)

function submit() {
  submitted.value = true

  if (portsError.value !== undefined) {
    return
  }

  // keep fields this form doesn't know about (newer document formats)
  const next: VdfRule = {
    ...omit(rule, ['action', 'ports', 'log', 'logLabel']),
    id: rule.id,
    from: form.from,
    proto: form.proto,
  }

  if (form.action !== 'allow') {
    next.action = form.action
  }

  if (hasPorts.value && parsedPorts.value !== undefined && parsedPorts.value.length > 0) {
    next.ports = parsedPorts.value
  }

  if (form.log) {
    next.log = true

    if (form.logLabel !== '') {
      next.logLabel = form.logLabel
    }
  }

  emit('confirm', next)
}
</script>

<style lang="postcss" scoped>
.vdf-rule-drawer {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.6rem;
  }
}
</style>
