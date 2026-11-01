<template>
  <UiDrawer class="vdf-policy-drawer" @confirm="submit()" @dismiss="emit('cancel')">
    <template #title>{{ title }}</template>

    <template #content>
      <span class="typo-body-regular-small required-hint">{{ t('field:required') }}</span>

      <div class="fields">
        <VtsInputWrapper :label="t('firewall:policy-form:name')" :message="nameField.error" wrap-message>
          <UiInput
            v-model.trim="form.name"
            :accent="nameField.error ? 'danger' : 'brand'"
            required
            :placeholder="t('firewall:policy-form:name:placeholder')"
            @blur="nameField.onBlur()"
          />
        </VtsInputWrapper>

        <UiAlert v-if="groups.length === 0" accent="info">
          {{ t('firewall:policy-form:no-group') }}
          <template #description>
            <UiButton
              variant="secondary"
              accent="brand"
              size="small"
              left-icon="fa:plus"
              @click="emit('createGroup', name => (form.appliedTo = name))"
            >
              {{ t('firewall:new-group') }}
            </UiButton>
          </template>
        </UiAlert>
        <VtsInputWrapper :label="t('firewall:applied-to')" :message="appliedToMessages" wrap-message>
          <VtsSelect :id="appliedToSelectId" accent="brand">
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

        <VtsInputWrapper :label="t('firewall:tier')" :message="tierMessages" wrap-message>
          <VtsSelect :id="tierSelectId" accent="brand" />
        </VtsInputWrapper>

        <UiRadioButtonGroup :label="t('firewall:policy-form:mode')" accent="brand" gap="wide">
          <UiRadioButton v-for="mode of modes" :key="mode" v-model="form.mode" :value="mode" accent="brand">
            {{ t(`firewall:mode:${mode}`) }}
          </UiRadioButton>
        </UiRadioButtonGroup>
        <UiInfo :accent="form.mode === 'monitor' ? 'info' : 'muted'" wrap>
          {{ t(`firewall:policy-form:mode:${form.mode}`) }}
        </UiInfo>

        <UiRadioButtonGroup :label="t('firewall:policy-form:default')" accent="brand" gap="wide">
          <UiRadioButton v-for="action of defaults" :key="action" v-model="form.default" :value="action" accent="brand">
            <VdfActionTag :action is-default />
          </UiRadioButton>
        </UiRadioButtonGroup>
        <UiInfo v-if="defaultWarning" accent="warning" wrap>{{ defaultWarning }}</UiInfo>
        <UiInfo v-else accent="muted" wrap>{{ t(`firewall:policy-form:default:${form.default}`) }}</UiInfo>

        <!-- what the default drops, logged: a checkbox, as XO's forms have, shown when a default drops -->
        <UiCheckbox v-if="isLogShown" v-model="form.logDefault" accent="brand">
          {{ t('firewall:policy-form:log-default') }}
        </UiCheckbox>

        <!-- most policies are inbound only: the outbound default out of the way unless it's set -->
        <VdfTechnicalDetails :label="t('firewall:policy-form:outbound')" :open="isOutboundOpen">
          <UiRadioButtonGroup :label="t('firewall:policy-form:egress-default')" accent="brand" gap="wide">
            <UiRadioButton
              v-for="action of egressDefaults"
              :key="action"
              v-model="form.egressDefault"
              :value="action"
              accent="brand"
            >
              <VdfActionTag :action is-default />
            </UiRadioButton>
          </UiRadioButtonGroup>
          <UiInfo v-if="egressDefaultWarning" accent="warning" wrap>{{ egressDefaultWarning }}</UiInfo>
          <UiInfo v-else accent="muted" wrap>
            {{ t(`firewall:policy-form:egress-default:${form.egressDefault}`) }}
          </UiInfo>
        </VdfTechnicalDetails>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayButton v-if="isNew" variant="secondary" @click="submit(true)">
        {{ t('firewall:policy-form:save-and-add-rule') }}
      </VtsOverlayButton>
      <VtsOverlayConfirmButton>{{ t('firewall:save-to-draft') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import VdfTechnicalDetails from '@/modules/vdf/components/overview/VdfTechnicalDetails.vue'
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import type { VdfGroupOption } from '@/modules/vdf/composables/vdf-editors.composable.ts'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import {
  VDF_APPLICATION_TIER,
  VDF_TIERS,
  type VdfDefaultAction,
  type VdfPolicy,
  type VdfPolicyMode,
} from '@/modules/vdf/types.ts'
import { displayName, isGlobalName, isReservedTier } from '@/modules/vdf/utils/vdf-global.util.ts'
import { networkTagLabel } from '@/modules/vdf/utils/vdf-networks.util.ts'
import { tierName, tierValue, toTierRef } from '@/modules/vdf/utils/vdf-policy.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayButton from '@core/components/overlay/VtsOverlayButton.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { omit } from 'lodash-es'
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { policy, isNew, groups, otherPolicyNames, reservedTiers } = defineProps<{
  policy: VdfPolicy
  isNew: boolean
  // groups with tags: a policy applies to VMs, never to static IPs
  groups: VdfGroupOption[]
  otherPolicyNames: string[]
  // a pool the global configuration applies to: the tiers up to
  // securityops are the global policies' (vdf#21)
  reservedTiers?: boolean
}>()

const emit = defineEmits<{
  confirm: [policy: VdfPolicy, addRule?: boolean]
  cancel: []
  // opens the group drawer, and `select`s the group it creates
  createGroup: [select: (name: string) => void]
}>()

const { t } = useI18n()

const tierLabel = useVdfTierLabel()

const title = computed(() =>
  isNew ? t('firewall:policy-form:new') : t('firewall:policy-form:edit', { name: displayName(policy.name) })
)

const defaults: VdfDefaultAction[] = ['drop', 'allow', 'pass']

// what the VMs may reach (vdf#53): next tier unless a policy says
// otherwise; the same order as the inbound default's
const egressDefaults: VdfDefaultAction[] = ['drop', 'allow', 'pass']

// monitor: the normal start for a new policy (vdf#13)
const modes: VdfPolicyMode[] = ['monitor', 'enforce']

const form = reactive({
  name: policy.name,
  tier: tierValue(policy.tier),
  appliedTo: policy.appliedTo,
  default: policy.default,
  logDefault: policy.logDefault ?? false,
  egressDefault: policy.egressDefault ?? 'pass',
  mode: (policy.mode === 'monitor' ? 'monitor' : 'enforce') as VdfPolicyMode,
})

// a default (inbound or outbound) that drops: what it drops can be logged
const isLogShown = computed(() => form.default === 'drop' || form.egressDefault === 'drop')

// open when the policy has an outbound default or outbound rules
const isOutboundOpen = (policy.egressDefault ?? 'pass') !== 'pass' || (policy.egress ?? []).length > 0

const { useField, useFormSelect, useSelect, validate } = useValidatedForm(form, {
  errors: {
    onSubmit: () => ({
      name: {
        required: withMessage(required, () => t('firewall:policy-form:name:required')),
        reserved: withMessage(
          (name: unknown) => !isGlobalName(String(name ?? '')),
          () => t('firewall:policy-form:name:reserved')
        ),
        taken: withMessage(
          (name: unknown) => !otherPolicyNames.includes(String(name ?? '')),
          () => t('firewall:policy-form:name:taken')
        ),
      },
      appliedTo: {
        required: withMessage(required, () => t('firewall:policy-form:applied-to:required')),
      },
      tier: {
        reserved: withMessage(
          (value: unknown) => !reservedTiers || !isReservedTier(Number(value)),
          () => t('firewall:policy-form:tier:reserved')
        ),
      },
    }),
  },
})

const nameField = useField('name')

const tiers = computed(() => {
  // in a pool in scope, the global policies' tiers aren't offered
  const values: number[] = VDF_TIERS.map(tier => tier.value).filter(value => !reservedTiers || !isReservedTier(value))

  // a numeric tier from a hand-written document stays selectable, and so
  // does a reserved one the policy is in (to see why it must move)
  if (!values.includes(form.tier)) {
    values.push(form.tier)
  }

  return values.sort((a, b) => a - b).map(value => ({ value, label: tierLabel(value) }))
})

const { id: tierSelectId } = useFormSelect('tier', tiers, {
  required: true,
  option: { id: 'value', value: 'value', label: 'label' },
})

const tierSelect = useSelect(tierSelectId)

const tierMessages = computed(() => {
  const name = tierName(form.tier)
  const messages: InputWrapperMessage = []

  if (name !== undefined) {
    messages.push(t(`firewall:tier:${name}:owner`))
  }

  if (reservedTiers && !isReservedTier(form.tier)) {
    messages.push({ content: t('firewall:policy-form:tier:reserved-info'), accent: 'muted' })
  }

  if (tierSelect.value.error !== undefined) {
    messages.push(tierSelect.value.error as { content: string; accent: 'danger' })
  }

  return messages
})

// the last option of the select opens the group drawer
const NEW_GROUP = '\0new-group'

const appliedToOptions = computed(() => [
  ...groups.map(group => ({ ...group, isNew: false })),
  { name: NEW_GROUP, members: 0, ips: 0, isNew: true },
])

const { id: appliedToSelectId } = useFormSelect('appliedTo', appliedToOptions, {
  required: true,
  searchable: true,
  placeholder: () => t('firewall:policy-form:applied-to:placeholder'),
  option: {
    id: 'name',
    value: 'name',
    properties: option => ({ isNew: option.isNew }),
    label: option =>
      option.isNew
        ? t('firewall:new-group-option')
        : t('firewall:group-option', {
            name: isGlobalName(option.name)
              ? t('firewall:global-name', { name: displayName(option.name) })
              : option.name,
            // a group on networks alone (vdf#98): its interfaces there
            members:
              option.networksOnly === undefined
                ? t('firewall:group:members', { n: option.members })
                : t('firewall:group:networks-only:short', {
                    networks: option.networksOnly.map(networkTagLabel).join(', '),
                    n: option.interfaces ?? 0,
                  }),
          }),
  },
})

watch(
  () => form.appliedTo,
  (value, previous) => {
    if (value === NEW_GROUP) {
      form.appliedTo = previous
      emit('createGroup', name => (form.appliedTo = name))
    }
  }
)

const appliedTo = useSelect(appliedToSelectId)

const members = computed(() => groups.find(group => group.name === form.appliedTo)?.members)

// a group on networks alone (vdf#98): what it means, with a live count
const networksOnly = computed(() => groups.find(group => group.name === form.appliedTo && group.networksOnly))

const appliedToMessages = computed(() => {
  const messages: InputWrapperMessage = [
    networksOnly.value === undefined
      ? t('firewall:policy-form:applied-to:info')
      : {
          content: t(
            'firewall:policy-form:applied-to:networks-only',
            {
              networks: networksOnly.value.networksOnly!.map(networkTagLabel).join(', '),
              n: networksOnly.value.interfaces ?? 0,
            },
            networksOnly.value.interfaces ?? 0
          ),
          accent: 'info' as const,
        },
  ]

  if (appliedTo.value.error !== undefined) {
    messages.push(appliedTo.value.error as { content: string; accent: 'danger' })
  }

  return messages
})

const defaultWarning = computed(() => {
  // monitor mode decides nothing: nothing to warn about yet
  if (form.mode === 'monitor') {
    return undefined
  }

  // until rules are added, the default decides alone
  if (form.default === 'drop' && policy.ingress.length === 0 && members.value !== undefined) {
    return t('firewall:policy-form:default:drop-everything', { n: members.value })
  }

  if (form.default === 'allow' && form.tier < VDF_APPLICATION_TIER) {
    return t('firewall:policy-form:default:allow-early')
  }

  if (form.default === 'drop' && form.tier < VDF_APPLICATION_TIER) {
    return t('firewall:policy-form:default:drop-early')
  }

  return undefined
})

const egressDefaultWarning = computed(() => {
  if (form.mode === 'monitor' || form.egressDefault !== 'drop') {
    return undefined
  }

  // until outbound rules are added, the default decides alone
  return (policy.egress ?? []).length === 0 ? t('firewall:policy-form:egress-default:drop-everything') : undefined
})

async function submit(addRule = false) {
  if (!(await validate())) {
    return
  }

  const next: VdfPolicy = {
    ...omit(policy, ['tier', 'logDefault', 'mode', 'egressDefault']),
    name: form.name,
    appliedTo: form.appliedTo,
    default: form.default,
    ingress: policy.ingress,
  }
  const tier = toTierRef(form.tier)

  if (tier !== undefined) {
    next.tier = tier
  }

  // only when a default drops: there is nothing else to log
  if (form.logDefault && isLogShown.value) {
    next.logDefault = true
  }

  // next tier is the default: absent from the document (a policy without
  // outbound rules then takes no part in egress)
  if (form.egressDefault !== 'pass') {
    next.egressDefault = form.egressDefault
  }

  // enforce is the default: absent from the document
  if (form.mode === 'monitor') {
    next.mode = 'monitor'
  }

  emit('confirm', next, addRule)
}
</script>

<style lang="postcss" scoped>
.vdf-policy-drawer {
  .required-hint::before {
    content: '* ';
    color: var(--color-brand-txt-base);
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    margin-block-start: 2.4rem;
  }

  .new-group {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--color-brand-txt-base);
  }
}
</style>
