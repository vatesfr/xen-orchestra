<template>
  <UiDrawer :title @confirm="submit()" @dismiss="emit('cancel')">
    <template #content>
      <div class="vdf-policy-drawer">
        <VtsInputWrapper :label="t('firewall:policy-form:name')" :message="nameError" wrap-message>
          <UiInput v-model.trim="form.name" :accent="nameError ? 'danger' : 'brand'" required placeholder="database" />
        </VtsInputWrapper>

        <VtsInputWrapper :label="t('firewall:tier')" :message="tierInfo" wrap-message>
          <VtsSelect :id="tierSelectId" accent="brand" />
        </VtsInputWrapper>

        <VtsInputWrapper
          :label="t('firewall:applied-to')"
          :message="appliedToError ?? t('firewall:policy-form:applied-to:info')"
          wrap-message
        >
          <VtsSelect :id="appliedToSelectId" accent="brand" />
        </VtsInputWrapper>

        <UiRadioButtonGroup :label="t('firewall:policy-form:default')" accent="brand" gap="wide">
          <UiRadioButton v-for="action of defaults" :key="action" v-model="form.default" :value="action" accent="brand">
            <VdfActionTag :action is-default />
          </UiRadioButton>
        </UiRadioButtonGroup>
        <UiInfo :accent="defaultWarning ? 'warning' : 'muted'" wrap>
          {{ defaultWarning ?? t(`firewall:policy-form:default:${form.default}`) }}
        </UiInfo>

        <UiToggle v-model="form.logDefault">{{ t('firewall:policy-form:log-default') }}</UiToggle>
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
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import { VDF_APPLICATION_TIER, VDF_TIERS, type VdfDefaultAction, type VdfPolicy } from '@/modules/vdf/types.ts'
import { tierName, tierValue, toTierRef } from '@/modules/vdf/utils/vdf-policy.util.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
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

const { policy, isNew, groups, otherPolicyNames } = defineProps<{
  policy: VdfPolicy
  isNew: boolean
  // groups with tags: a policy applies to VMs, never to static IPs
  groups: { name: string; members: number }[]
  otherPolicyNames: string[]
}>()

const emit = defineEmits<{
  confirm: [policy: VdfPolicy]
  cancel: []
}>()

const { t } = useI18n()

const tierLabel = useVdfTierLabel()

const title = computed(() =>
  isNew ? t('firewall:policy-form:new') : t('firewall:policy-form:edit', { name: policy.name })
)

const defaults: VdfDefaultAction[] = ['drop', 'allow', 'pass']

const form = reactive({
  name: policy.name,
  tier: tierValue(policy.tier),
  appliedTo: policy.appliedTo,
  default: policy.default,
  logDefault: policy.logDefault ?? false,
})

const tiers = computed(() => {
  const values: number[] = VDF_TIERS.map(tier => tier.value)

  // a numeric tier from a hand-written document stays selectable
  if (!values.includes(form.tier)) {
    values.push(form.tier)
  }

  return values.sort((a, b) => a - b).map(value => ({ value, label: `${value} · ${tierLabel(value)}` }))
})

const { id: tierSelectId } = useFormSelect(tiers, {
  model: toRef(form, 'tier'),
  required: true,
  option: { id: 'value', value: 'value', label: 'label' },
})

const tierInfo = computed(() => {
  const name = tierName(form.tier)

  return name === undefined ? undefined : t(`firewall:tier:${name}:owner`)
})

const { id: appliedToSelectId } = useFormSelect(groups, {
  model: toRef(form, 'appliedTo'),
  required: true,
  searchable: true,
  option: {
    id: 'name',
    value: 'name',
    label: group => `${group.name} (${t('firewall:group:members', { n: group.members })})`,
  },
})

const defaultWarning = computed(() => {
  if (form.default === 'allow' && form.tier < VDF_APPLICATION_TIER) {
    return t('firewall:policy-form:default:allow-early')
  }

  return undefined
})

const submitted = ref(false)

const nameError = computed(() => {
  if (!submitted.value) {
    return undefined
  }

  if (form.name === '') {
    return { content: t('firewall:policy-form:name:required'), accent: 'danger' as const }
  }

  if (otherPolicyNames.includes(form.name)) {
    return { content: t('firewall:policy-form:name:taken'), accent: 'danger' as const }
  }

  return undefined
})

const appliedToError = computed(() =>
  submitted.value && !form.appliedTo
    ? { content: t('firewall:policy-form:applied-to:required'), accent: 'danger' as const }
    : undefined
)

function submit() {
  submitted.value = true

  if (nameError.value !== undefined || appliedToError.value !== undefined) {
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

  emit('confirm', next)
}
</script>

<style lang="postcss" scoped>
.vdf-policy-drawer {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
