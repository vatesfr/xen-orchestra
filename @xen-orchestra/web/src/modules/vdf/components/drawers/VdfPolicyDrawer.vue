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

        <VtsInputWrapper :label="t('firewall:tier')" :message="tierInfo" wrap-message>
          <VtsSelect :id="tierSelectId" accent="brand" />
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

        <UiRadioButtonGroup :label="t('firewall:policy-form:default')" accent="brand" gap="wide">
          <UiRadioButton v-for="action of defaults" :key="action" v-model="form.default" :value="action" accent="brand">
            <VdfActionTag :action is-default />
          </UiRadioButton>
        </UiRadioButtonGroup>
        <UiInfo v-if="defaultWarning" accent="warning" wrap>{{ defaultWarning }}</UiInfo>
        <UiInfo v-else accent="muted" wrap>{{ t(`firewall:policy-form:default:${form.default}`) }}</UiInfo>

        <UiToggle v-model="form.logDefault">{{ t('firewall:policy-form:log-default') }}</UiToggle>
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
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import type { VdfGroupOption } from '@/modules/vdf/composables/vdf-editors.composable.ts'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import { VDF_APPLICATION_TIER, VDF_TIERS, type VdfDefaultAction, type VdfPolicy } from '@/modules/vdf/types.ts'
import { displayName, isGlobalName } from '@/modules/vdf/utils/vdf-global.util.ts'
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
import { useI18n } from 'vue-i18n'

const { policy, isNew, groups, otherPolicyNames } = defineProps<{
  policy: VdfPolicy
  isNew: boolean
  // groups with tags: a policy applies to VMs, never to static IPs
  groups: VdfGroupOption[]
  otherPolicyNames: string[]
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

const form = reactive({
  name: policy.name,
  tier: tierValue(policy.tier),
  appliedTo: policy.appliedTo,
  default: policy.default,
  logDefault: policy.logDefault ?? false,
})

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
    }),
  },
})

const nameField = useField('name')

const tiers = computed(() => {
  const values: number[] = VDF_TIERS.map(tier => tier.value)

  // a numeric tier from a hand-written document stays selectable
  if (!values.includes(form.tier)) {
    values.push(form.tier)
  }

  return values.sort((a, b) => a - b).map(value => ({ value, label: tierLabel(value) }))
})

const { id: tierSelectId } = useFormSelect('tier', tiers, {
  required: true,
  option: { id: 'value', value: 'value', label: 'label' },
})

const tierInfo = computed(() => {
  const name = tierName(form.tier)

  return name === undefined ? undefined : t(`firewall:tier:${name}:owner`)
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
            members: t('firewall:group:members', { n: option.members }),
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

const appliedToMessages = computed(() => {
  const messages: InputWrapperMessage = [t('firewall:policy-form:applied-to:info')]

  if (appliedTo.value.error !== undefined) {
    messages.push(appliedTo.value.error as { content: string; accent: 'danger' })
  }

  return messages
})

const defaultWarning = computed(() => {
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

async function submit(addRule = false) {
  if (!(await validate())) {
    return
  }

  const next: VdfPolicy = {
    ...omit(policy, ['tier', 'logDefault']),
    name: form.name,
    appliedTo: form.appliedTo,
    default: form.default,
    ingress: policy.ingress,
  }
  const tier = toTierRef(form.tier)

  if (tier !== undefined) {
    next.tier = tier
  }

  if (form.logDefault) {
    next.logDefault = true
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
