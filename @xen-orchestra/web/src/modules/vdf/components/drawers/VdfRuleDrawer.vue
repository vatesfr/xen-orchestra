<template>
  <UiDrawer class="vdf-rule-drawer" @confirm="submit()" @dismiss="emit('cancel')">
    <template #title>{{ title }}</template>

    <template #content>
      <UiAlert accent="info">
        <I18nT keypath="firewall:rule-form:preview" scope="global" tag="span">
          <template #action>
            <strong>{{ t(`firewall:action:${form.action}`) }}</strong>
          </template>
          <template #source>
            <strong>{{ sourceLabel }}</strong>
          </template>
          <template #destination>
            <strong>{{ destinationLabel }}</strong>
          </template>
          <template #service>
            <strong>{{ serviceLabel }}</strong>
          </template>
        </I18nT>
        <template #description>{{ t('firewall:rule-form:context', { id: displayId }) }}</template>
      </UiAlert>

      <span class="typo-body-regular-small required-hint">{{ t('field:required') }}</span>

      <div class="fields">
        <UiRadioButtonGroup :label="t('firewall:rule-form:action')" accent="brand" gap="wide">
          <UiRadioButton v-for="action of actions" :key="action" v-model="form.action" :value="action" accent="brand">
            <VdfActionTag :action />
          </UiRadioButton>
        </UiRadioButtonGroup>
        <UiInfo accent="muted" wrap>{{ t(`firewall:rule-form:action:${form.action}`) }}</UiInfo>

        <VtsInputWrapper :label="peerText('label')" :message="sourceMessages" wrap-message>
          <VtsSelect :id="sourceSelectId" accent="brand">
            <template #default="{ option }">
              <VtsOption :option>
                <span v-if="option.properties.isNew" class="new-group">
                  <VtsIcon name="fa:plus" size="small" />
                  {{ option.properties.label }}
                </span>
                <template v-else>{{ option.properties.label }}</template>
              </VtsOption>
            </template>
          </VtsSelect>
        </VtsInputWrapper>
        <UiAlert v-if="address !== undefined && form.from === ''" accent="warning">
          {{ peerText('address', { address }) }}
          <template #description>
            <UiButton
              variant="secondary"
              accent="brand"
              size="small"
              left-icon="fa:plus"
              @click="emit('createGroup', name => (form.from = name), { ips: [address] })"
            >
              {{ t('firewall:rule-form:source:address:create') }}
            </UiButton>
          </template>
        </UiAlert>

        <div class="row">
          <VtsInputWrapper :label="t('firewall:rule-form:protocol')">
            <VtsSelect :id="protocolSelectId" accent="brand" />
          </VtsInputWrapper>
          <VtsInputWrapper v-if="hasPorts" :label="t('firewall:rule-form:ports')" :message="portsMessages" wrap-message>
            <UiInput
              v-model.trim="form.ports"
              :accent="portsField.error ? 'danger' : 'brand'"
              :placeholder="t('firewall:rule-form:ports:placeholder')"
              @blur="portsField.onBlur()"
            />
          </VtsInputWrapper>
        </div>

        <UiToggle v-model="form.log">{{ t('firewall:rule-form:log') }}</UiToggle>
        <UiInfo v-if="form.action === 'pass' && form.log" accent="warning" wrap>
          {{ t('firewall:rule-form:log:pass') }}
        </UiInfo>
        <VtsInputWrapper v-if="form.log" :label="t('firewall:rule-form:log-label')">
          <UiInput
            v-model.trim="form.logLabel"
            accent="brand"
            :placeholder="t('firewall:rule-form:log-label:placeholder')"
          />
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
import type { VdfGroupOption } from '@/modules/vdf/composables/vdf-editors.composable.ts'
import type { VdfGroup, VdfProtocol, VdfRule, VdfRuleAction } from '@/modules/vdf/types.ts'
import { displayName, isGlobalName, ruleNumber } from '@/modules/vdf/utils/vdf-global.util.ts'
import { formatPorts, parsePorts, ruleAction } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { isEgressRule, rulePeer } from '@/modules/vdf/utils/vdf-rules.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { omit } from 'lodash-es'
import { computed, reactive, watch } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

const {
  policyName,
  rule,
  isNew,
  groups,
  appliedTo,
  global = false,
} = defineProps<{
  policyName: string
  // the policy's group: where the rule's connections go (egress: where
  // they come from)
  appliedTo?: string
  // an egress rule (vdf#53) has a destination (to) instead of a source
  rule: VdfRule
  isNew: boolean
  groups: VdfGroupOption[]
  // a prefilled source (egress: destination) address no group holds yet
  address?: string
  // a rule of the global configuration: numbered G10
  global?: boolean
}>()

const emit = defineEmits<{
  confirm: [rule: VdfRule]
  cancel: []
  // opens the group drawer (prefilled), and `select`s the group it creates
  createGroup: [select: (name: string) => void, group?: VdfGroup]
}>()

const { t } = useI18n()

const displayId = computed(() => ruleNumber(rule.id, { global }))

// an egress rule's form asks for a destination, the rest is the same
const isEgress = isEgressRule(rule)

const peerText = (key: string, values: Record<string, unknown> = {}) =>
  t(`firewall:rule-form:${isEgress ? 'destination' : 'source'}${key === 'label' ? '' : `:${key}`}`, values)

const title = computed(() =>
  isNew
    ? t(isEgress ? 'firewall:rule-form:new-egress-in' : 'firewall:rule-form:new-in', {
        policy: displayName(policyName),
      })
    : t('firewall:rule-form:edit', { id: displayId.value })
)

const actions: VdfRuleAction[] = ['allow', 'drop', 'pass']

const form = reactive({
  action: ruleAction(rule),
  // the source, or an egress rule's destination
  from: rulePeer(rule),
  proto: rule.proto,
  ports: formatPorts(rule.ports),
  log: rule.log ?? false,
  logLabel: rule.logLabel ?? '',
})

const hasPorts = computed(() => form.proto === 'tcp' || form.proto === 'udp')

const { useField, useFormSelect, useSelect, validate } = useValidatedForm(form, {
  errors: {
    onSubmit: () => ({
      from: { required: withMessage(required, () => peerText('required')) },
    }),
    onBlur: () => ({
      ports: {
        ports: withMessage(
          (ports: unknown) => !hasPorts.value || parsePorts(String(ports ?? '')) !== undefined,
          () => t('firewall:rule-form:ports:invalid')
        ),
      },
    }),
  },
})

// a global group, usable in a pool: "admins (global)"
function groupName(name: string) {
  return isGlobalName(name) ? t('firewall:global-name', { name: displayName(name) }) : name
}

function groupSize({ members, ips }: VdfGroupOption) {
  const vms = t('firewall:group:members', { n: members })

  if (ips === 0) {
    return vms
  }

  return members === 0
    ? t('firewall:group:ips', { n: ips })
    : t('firewall:group-option:both', { vms, ips: t('firewall:group:ips', { n: ips }) })
}

const ANY = 'any'

// the last option of the select opens the group drawer
const NEW_GROUP = '\0new-group'

const sourceOptions = computed(() => [
  { name: ANY, label: peerText('any'), isNew: false },
  ...groups.map(group => ({
    name: group.name,
    label: t('firewall:group-option', { name: groupName(group.name), members: groupSize(group) }),
    isNew: false,
  })),
  { name: NEW_GROUP, label: t('firewall:new-group-option'), isNew: true },
])

const { id: sourceSelectId } = useFormSelect('from', sourceOptions, {
  required: true,
  searchable: true,
  placeholder: () => peerText('placeholder'),
  option: { id: 'name', value: 'name', label: 'label', properties: option => ({ isNew: option.isNew }) },
})

watch(
  () => form.from,
  (value, previous) => {
    if (value === NEW_GROUP) {
      form.from = previous
      emit('createGroup', name => (form.from = name))
    }
  }
)

const source = useSelect(sourceSelectId)

const sourceMessages = computed(() => {
  const messages: InputWrapperMessage = []

  if (form.from === ANY) {
    messages.push(peerText('any:info'))
  }

  if (source.value.error !== undefined) {
    messages.push(source.value.error as { content: string; accent: 'danger' })
  }

  return messages
})

const protocols: { value: VdfProtocol; label: string }[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'icmp', label: 'ICMP' },
  { value: 'any', label: t('firewall:rule-form:protocol:any') },
]

const { id: protocolSelectId } = useFormSelect('proto', protocols, {
  required: true,
  option: { id: 'value', value: 'value', label: 'label' },
})

const portsField = useField('ports')

const portsMessages = computed(() =>
  portsField.value.error === undefined
    ? t('firewall:rule-form:ports:info')
    : [t('firewall:rule-form:ports:info'), portsField.value.error as { content: string; accent: 'danger' }]
)

// THE SENTENCE the rule reads as on the board

const peerLabel = computed(() => {
  if (form.from === ANY) {
    return t('firewall:any')
  }

  return form.from === '' ? '…' : displayName(form.from)
})

const groupLabel = computed(() => (appliedTo ? displayName(appliedTo) : displayName(policyName)))

const sourceLabel = computed(() => (isEgress ? groupLabel.value : peerLabel.value))

const destinationLabel = computed(() => (isEgress ? peerLabel.value : groupLabel.value))

const serviceLabel = computed(() => {
  if (form.proto === 'any') {
    return t('firewall:any-protocol')
  }

  const parsed = hasPorts.value ? parsePorts(form.ports) : []
  // as typed while it doesn't parse: "all ports" would be wrong
  const ports = parsed === undefined ? form.ports : formatPorts(parsed)

  return ports === ''
    ? t('firewall:service:all', { proto: form.proto.toUpperCase() })
    : t('firewall:service:ports', { proto: form.proto.toUpperCase(), ports })
})

async function submit() {
  if (!(await validate())) {
    return
  }

  const ports = hasPorts.value ? parsePorts(form.ports) : undefined

  // keep fields this form doesn't know about (newer document formats)
  const next: VdfRule = {
    ...omit(rule, ['action', 'from', 'to', 'ports', 'log', 'logLabel']),
    id: rule.id,
    ...(isEgress ? { to: form.from } : { from: form.from }),
    proto: form.proto,
  }

  if (form.action !== 'allow') {
    next.action = form.action
  }

  if (ports !== undefined && ports.length > 0) {
    next.ports = ports
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
  .required-hint {
    display: block;
    margin-block-start: 2.4rem;

    &::before {
      content: '* ';
      color: var(--color-brand-txt-base);
    }
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    margin-block-start: 2.4rem;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.6rem;
  }

  .new-group {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--color-brand-txt-base);
  }
}
</style>
