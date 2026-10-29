<template>
  <UiDrawer class="vdf-service-drawer" @confirm="submit()" @dismiss="emit('cancel')">
    <template #title>
      {{ isNew ? t('firewall:service-form:new') : t('firewall:service-form:edit', { name: service.name }) }}
    </template>

    <template #content>
      <div class="fields">
        <UiInfo accent="info" wrap>{{ t('firewall:services:info') }}</UiInfo>
        <!-- a source the hosts saw (vdf#103): what to do with it -->
        <UiInfo v-if="address !== undefined" accent="warning" wrap>
          {{ t('firewall:service-form:seen', { address }) }}
        </UiInfo>

        <VtsInputWrapper :label="t('firewall:service-form:name')" :message="message('name')" wrap-message>
          <UiInput v-model.trim="form.name" :accent="message('name') ? 'danger' : 'brand'" required />
        </VtsInputWrapper>

        <UiRadioButtonGroup :label="t('firewall:service-form:kind')" accent="brand" gap="narrow" vertical>
          <UiRadioButton v-for="kind of VDF_SERVICE_KINDS" :key="kind" v-model="form.kind" :value="kind" accent="brand">
            {{ t(`firewall:service:kind:${kind}`) }}
          </UiRadioButton>
        </UiRadioButtonGroup>

        <VtsInputWrapper :label="t('firewall:service-form:group')" :message="message('group')" wrap-message>
          <VtsSelect :id="groupSelectId" accent="brand" />
        </VtsInputWrapper>
        <UiInfo accent="muted" wrap>{{ t('firewall:service-form:group:info') }}</UiInfo>
        <div class="actions">
          <UiButton variant="secondary" accent="brand" size="small" left-icon="fa:plus" @click="newGroup()">
            {{
              address === undefined
                ? t('firewall:new-group')
                : t('firewall:service-form:group-for-address', { address })
            }}
          </UiButton>
        </div>

        <section class="section">
          <UiLabel accent="neutral">{{ t('firewall:service-form:macs') }}</UiLabel>
          <UiInfo accent="muted" wrap>{{ t('firewall:service-form:macs:info') }}</UiInfo>
          <div v-if="form.macs.length > 0" class="chips">
            <UiChip v-for="mac of form.macs" :key="mac" accent="info" @remove="removeMac(mac)">{{ mac }}</UiChip>
          </div>
          <VtsInputWrapper :message="message('macs')" wrap-message>
            <div class="add">
              <UiInput
                v-model.trim="newMac"
                :accent="message('macs') ? 'danger' : 'brand'"
                :aria-label="t('firewall:service-form:macs')"
                placeholder="00:16:3e:aa:bb:cc"
                @keydown.enter.prevent="addMac()"
              />
              <UiButton variant="secondary" accent="brand" size="medium" left-icon="fa:plus" @click="addMac()">
                {{ t('firewall:service-form:add-mac') }}
              </UiButton>
            </div>
          </VtsInputWrapper>
        </section>

        <UiRadioButtonGroup :label="t('firewall:policy-form:mode')" accent="brand" gap="wide">
          <UiRadioButton v-for="mode of MODES" :key="mode" v-model="form.mode" :value="mode" accent="brand">
            {{ t(`firewall:mode:${mode}`) }}
          </UiRadioButton>
        </UiRadioButtonGroup>
        <UiInfo :accent="form.mode === 'monitor' ? 'info' : 'warning'" wrap>
          {{ t(`firewall:service-form:mode:${form.mode}`) }}
        </UiInfo>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('firewall:save-to-draft') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import type { VdfGroup, VdfService, VdfServiceKind } from '@/modules/vdf/types.ts'
import { displayName, isGlobalName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { isNetworksOnly } from '@/modules/vdf/utils/vdf-networks.util.ts'
import {
  canonMac,
  serviceErrors,
  VDF_SERVICE_KINDS,
  type VdfServiceError,
} from '@/modules/vdf/utils/vdf-services.util.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed, reactive, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

// A declared infrastructure service (vdf#103): a kind, the group holding
// its servers (VM tags, or addresses with their MACs for servers outside
// the pool), monitor or enforce. Checked as the agent checks it.
const { service, isNew, groups, otherServiceNames, address } = defineProps<{
  service: VdfService
  isNew: boolean
  // the document's groups (a group created from here shows up)
  groups: Record<string, VdfGroup>
  otherServiceNames: string[]
  // a source the hosts saw, declared from the status
  address?: string
}>()

const emit = defineEmits<{
  confirm: [service: VdfService]
  cancel: []
  // opens the group drawer, and `select`s the group it creates
  createGroup: [select: (name: string) => void, prefill?: VdfGroup]
}>()

const { t } = useI18n()

const MODES = ['monitor', 'enforce'] as const

const form = reactive({
  name: service.name,
  kind: service.kind as VdfServiceKind,
  group: service.group,
  macs: [...(service.macs ?? [])],
  mode: (service.mode === 'monitor' ? 'monitor' : 'enforce') as 'monitor' | 'enforce',
})

// a group on networks alone can't hold servers: not offered
const groupOptions = computed(() =>
  Object.entries(groups)
    .filter(([, group]) => !isNetworksOnly(group))
    .map(([name, group]) => ({
      name,
      label: t('firewall:service-form:group-option', {
        name: isGlobalName(name) ? t('firewall:global-name', { name: displayName(name) }) : name,
        what: [...(group.tags ?? []), ...(group.ips ?? [])].join(', ') || '—',
      }),
    }))
)

const { id: groupSelectId } = useFormSelect(groupOptions, {
  model: toRef(form, 'group'),
  searchable: true,
  placeholder: t('firewall:service-form:group:placeholder'),
  option: { id: 'name', value: 'name', label: 'label' },
})

function newGroup() {
  emit('createGroup', name => (form.group = name), address === undefined ? undefined : { tags: [], ips: [address] })
}

const newMac = ref('')

function addMac() {
  const mac = newMac.value === '' ? '' : canonMac(newMac.value)

  if (mac !== '' && !form.macs.includes(mac)) {
    form.macs.push(mac)
  }

  newMac.value = ''
}

function removeMac(mac: string) {
  form.macs = form.macs.filter(value => value !== mac)
}

const next = computed<VdfService>(() => ({
  name: form.name,
  kind: form.kind,
  group: form.group,
  ...(form.macs.length > 0 ? { macs: form.macs } : {}),
  ...(form.mode === 'monitor' ? { mode: 'monitor' as const } : {}),
}))

const isSubmitted = ref(false)

const errors = computed(() =>
  serviceErrors({ groups, policies: [] }, next.value, otherServiceNames).filter(
    // no group picked yet: said once submitted
    error => !(error.type === 'unknown-group' && form.group === '' && !isSubmitted.value)
  )
)

const FIELDS: Record<VdfServiceError['type'], 'name' | 'group' | 'macs'> = {
  'name-required': 'name',
  'name-taken': 'name',
  kind: 'group',
  'unknown-group': 'group',
  'networks-only': 'group',
  'selects-nothing': 'group',
  'mac-required': 'macs',
  'invalid-mac': 'macs',
  'multicast-mac': 'macs',
}

function message(field: 'name' | 'group' | 'macs') {
  const error = errors.value.find(candidate => FIELDS[candidate.type] === field)

  if (error === undefined || (field === 'name' && !isSubmitted.value)) {
    return undefined
  }

  return { content: t(`firewall:service-form:error:${error.type}`, { ...error }), accent: 'danger' as const }
}

function submit() {
  addMac()
  isSubmitted.value = true

  if (errors.value.length > 0) {
    return
  }

  emit('confirm', next.value)
}
</script>

<style lang="postcss" scoped>
.vdf-service-drawer {
  .fields {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .chips,
  .add,
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
