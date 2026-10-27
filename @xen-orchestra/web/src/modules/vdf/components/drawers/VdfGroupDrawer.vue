<template>
  <UiDrawer class="vdf-group-drawer" @confirm="submit()" @dismiss="emit('cancel')">
    <template #title>{{ title }}</template>

    <template #content>
      <span class="typo-body-regular-small required-hint">{{ t('field:required') }}</span>

      <div class="fields">
        <VtsInputWrapper :label="t('firewall:group-form:name')" :message="nameField.error" wrap-message>
          <UiInput
            v-model.trim="form.name"
            :accent="nameField.error ? 'danger' : 'brand'"
            required
            :placeholder="t('firewall:group-form:name:placeholder')"
            @blur="nameField.onBlur()"
          />
        </VtsInputWrapper>
        <UiInfo v-if="!isNew && form.name !== name" accent="info" wrap>
          {{ t('firewall:group-form:rename') }}
        </UiInfo>
        <!-- a pool group named as a global one would read the same in rules: said as it's typed -->
        <UiInfo v-if="isNamedAsGlobal && !nameField.error" accent="warning" wrap>
          {{ t('firewall:group-form:name:global', { name: form.name }) }}
        </UiInfo>

        <section class="section">
          <UiLabel accent="neutral">{{ t('firewall:group-form:tags') }}</UiLabel>
          <UiInfo accent="muted" wrap>{{ t('firewall:group-form:tags:info') }}</UiInfo>
          <!-- a tag reads as everywhere else: its two-tone pair -->
          <div v-if="form.tags.length > 0" class="chips">
            <UiChip v-for="tag of form.tags" :key="tag" accent="info" class="tag-chip" @remove="removeTag(tag)">
              <VtsTag :value="tag" />
            </UiChip>
          </div>
          <div class="add">
            <UiInput
              v-model.trim="newTag"
              accent="brand"
              :aria-label="t('firewall:group-form:tags')"
              :placeholder="t('firewall:group-form:tags:placeholder')"
              @keydown.enter.prevent="addTag()"
            />
            <UiButton variant="secondary" accent="brand" size="medium" left-icon="fa:plus" @click="addTag()">
              {{ t('firewall:group-form:add-tag') }}
            </UiButton>
          </div>
          <div v-if="suggestedTags.length > 0" class="suggestions typo-body-regular-small">
            <span class="secondary">{{ t('firewall:group-form:tags:suggestions') }}</span>
            <button v-for="tag of suggestedTags" :key="tag" type="button" class="suggestion" @click="addTag(tag)">
              <VtsTag :value="tag" />
            </button>
          </div>
        </section>

        <section class="section">
          <UiLabel accent="neutral">{{ t('firewall:group-form:ips') }}</UiLabel>
          <UiInfo accent="muted" wrap>{{ t('firewall:group-form:ips:info') }}</UiInfo>
          <div v-if="form.ips.length > 0" class="chips">
            <UiChip v-for="ip of form.ips" :key="ip" accent="info" @remove="removeIp(ip)">{{ ip }}</UiChip>
          </div>
          <VtsInputWrapper :message="ipError" wrap-message>
            <div class="add">
              <UiInput
                v-model.trim="newIp"
                :accent="ipError ? 'danger' : 'brand'"
                :aria-label="t('firewall:group-form:ips')"
                :placeholder="t('firewall:group-form:ips:placeholder')"
                @keydown.enter.prevent="addIp()"
              />
              <UiButton variant="secondary" accent="brand" size="medium" left-icon="fa:plus" @click="addIp()">
                {{ t('firewall:group-form:add-ip') }}
              </UiButton>
            </div>
          </VtsInputWrapper>
        </section>

        <section class="section">
          <UiLabel accent="neutral">{{ t('firewall:group-form:interfaces') }}</UiLabel>
          <UiInfo accent="muted" wrap>{{ t('firewall:group-form:interfaces:info') }}</UiInfo>
          <div class="scope">
            <UiRadioButton v-model="form.scope" value="all" accent="brand">
              {{ t('firewall:group-form:interfaces:all') }}
            </UiRadioButton>
            <UiRadioButton v-model="form.scope" value="networks" accent="brand">
              {{ t('firewall:group-form:interfaces:networks') }}
            </UiRadioButton>
          </div>
          <template v-if="isScoped">
            <VtsStateHero v-if="scopeNetworks.length === 0" format="card" type="no-data" size="extra-small" horizontal>
              {{ t('firewall:group-form:networks:none') }}
            </VtsStateHero>
            <div v-else class="networks">
              <UiCheckbox
                v-for="network of scopeNetworks"
                :key="network.id"
                :model-value="form.networkIds.includes(network.id)"
                accent="brand"
                @update:model-value="toggleNetwork(network, $event === true)"
              >
                <span class="network">
                  <span>{{ network.name_label }}</span>
                  <span v-if="poolIds.length > 1" class="secondary typo-body-regular-small">{{
                    poolName(network.$pool)
                  }}</span>
                  <VtsTag v-for="tag of netTagsOf(network)" :key="tag" :value="tag" />
                </span>
              </UiCheckbox>
            </div>
            <VtsInputWrapper :label="t('firewall:group-form:network-tag')" :message="networkTagError" wrap-message>
              <UiInput v-model.trim="form.networkTag" :accent="networkTagError ? 'danger' : 'brand'" />
            </VtsInputWrapper>
            <UiInfo accent="info" wrap>{{ t('firewall:group-form:network-tag:info') }}</UiInfo>
            <UiInfo v-if="networkError" accent="danger" wrap>{{ networkError }}</UiInfo>
            <UiInfo v-if="peerOf.length > 0" accent="info" wrap>
              {{ t('firewall:group-form:networks:peer-of', { policies: peerOf.map(displayName).join(', ') }) }}
            </UiInfo>
            <UiInfo v-if="sharedWith.length > 0" accent="warning" wrap>
              {{ t('firewall:group-form:network-tag:shared', { groups: sharedWith.map(displayName).join(', ') }) }}
            </UiInfo>
          </template>
        </section>

        <section class="section">
          <UiLabel accent="neutral">{{ previewTitle }}</UiLabel>
          <UiInfo v-if="form.tags.length === 0" accent="muted" wrap>
            {{ t('firewall:group-form:preview:no-tags') }}
          </UiInfo>
          <!-- "only interfaces on some networks", none picked: why nothing matches -->
          <UiInfo v-else-if="isScoped && form.networkIds.length === 0" accent="muted" wrap>
            {{ t('firewall:group-form:preview:pick-network') }}
          </UiInfo>
          <div v-else class="vms">
            <div v-for="vm of matchingVms" :key="vm.id" class="vm-entry">
              <span class="vm typo-body-regular-small">
                <VtsIcon :name="vm.icon" size="medium" />
                {{ vm.name }}
              </span>
              <span
                v-for="iface of vm.interfaces"
                :key="iface.vif.id"
                class="iface typo-body-regular-small"
                :class="{ secondary: iface.unprotected }"
              >
                {{
                  t(
                    iface.unprotected
                      ? 'firewall:group-form:preview:interface-unprotected'
                      : 'firewall:group-form:preview:interface',
                    {
                      device: iface.vif.device,
                      network: iface.network?.name_label ?? '?',
                      ips: iface.ips.join(', ') || t('firewall:vm:no-ip'),
                    }
                  )
                }}
              </span>
            </div>
          </div>
        </section>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('firewall:save-to-draft') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVdfInterfaces, useVdfNetworkTags } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { VDF_GLOBAL_PREFIX, VDF_QUARANTINE_TAG, VDF_TAG_PREFIX, type VdfGroup } from '@/modules/vdf/types.ts'
import { displayName, isGlobalName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { isNetworkTag, networkTagFor, VDF_NET_TAG_PREFIX } from '@/modules/vdf/utils/vdf-networks.util.ts'
import { isVmInGroup } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import { objectIcon } from '@core/icons'
import { regex, required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { omit, toLower } from 'lodash-es'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  name,
  group,
  isNew,
  otherGroupNames,
  poolIds,
  networkTagUsers = {},
  scoped = false,
  peerOf = [],
} = defineProps<{
  name: string
  group: VdfGroup
  isNew: boolean
  otherGroupNames: string[]
  // where members are looked for: the pool, or the global scope's pools
  poolIds: string[]
  // the other groups naming each network tag (vdf#36)
  networkTagUsers?: Record<string, string[]>
  // open on "only interfaces on some networks"
  scoped?: boolean
  // the policies whose rules name it as a source or destination
  peerOf?: string[]
}>()

const emit = defineEmits<{
  confirm: [name: string, group: VdfGroup]
  cancel: []
}>()

const { t } = useI18n()

const title = computed(() =>
  isNew ? t('firewall:group-form:new') : t('firewall:group-form:edit', { name: displayName(name) })
)

const { vms } = useXoVmCollection()

const { networks, interfacesOf, groupInterfaces } = useVdfInterfaces()

const { pools } = useXoPoolCollection()

const poolName = (poolId: string) => pools.value.find(pool => pool.id === poolId)?.name_label ?? poolId

// INTERFACES (vdf#36): every interface of the VMs, or those on networks
// carrying one tag, which XO gives the networks picked here

// the networks of the scope a VM's interface can be on
const scopeNetworks = computed(() =>
  networks.value.filter(
    network => poolIds.includes(network.$pool) && network.other_config?.is_host_internal_management_network !== 'true'
  )
)

const initialTag = group.networks?.[0] ?? ''

const form = reactive({
  name,
  tags: [...(group.tags ?? [])],
  ips: [...(group.ips ?? [])],
  scope: (scoped || initialTag !== '' ? 'networks' : 'all') as string,
  networkTag: initialTag,
  // the networks picked: at first, those carrying the group's tag
  networkIds: [] as string[],
})

watch(
  scopeNetworks,
  list => {
    if (form.networkIds.length === 0 && initialTag !== '') {
      form.networkIds = list.filter(network => network.tags.includes(initialTag)).map(network => network.id)
    }
  },
  { immediate: true }
)

const isScoped = computed(() => form.scope === 'networks')

const netTagsOf = (network: FrontXoNetwork) => network.tags.filter(tag => tag.startsWith(VDF_NET_TAG_PREFIX))

// picking a first network proposes its tag: the one it has, or one from its name
function toggleNetwork(network: FrontXoNetwork, isPicked: boolean) {
  form.networkIds = isPicked
    ? [...form.networkIds, network.id]
    : form.networkIds.filter(networkId => networkId !== network.id)

  if (isPicked && form.networkTag === '') {
    form.networkTag = netTagsOf(network)[0] ?? networkTagFor(network.name_label)
  }
}

const networkTagError = computed(() => {
  if (!isScoped.value || form.networkTag === '' || isNetworkTag(form.networkTag)) {
    return undefined
  }

  return { content: t('firewall:group-form:network-tag:invalid'), accent: 'danger' as const }
})

const sharedWith = computed(() => (isScoped.value ? (networkTagUsers[form.networkTag] ?? []) : []))

const formGroup = computed<VdfGroup>(() => ({
  tags: form.tags,
  networks: isScoped.value && form.networkTag !== '' ? [form.networkTag] : undefined,
}))

// the interfaces the form selects: on the picked networks, before they're tagged
const matchingVms = computed(() =>
  vms.value
    .filter(vm => poolIds.includes(vm.$pool) && isVmInGroup(vm.tags, { tags: form.tags }))
    .map(vm => ({
      id: vm.id,
      name: vm.name_label,
      icon: objectIcon('vm', toLower(vm.power_state)),
      interfaces: isScoped.value
        ? interfacesOf(vm).filter(iface => form.networkIds.includes(iface.vif.$network))
        : groupInterfaces(vm, formGroup.value),
    }))
    .filter(vm => !isScoped.value || vm.interfaces.length > 0)
)

const previewTitle = computed(() => {
  const interfaceCount = matchingVms.value.reduce((count, vm) => count + vm.interfaces.length, 0)

  return interfaceCount === matchingVms.value.length
    ? t('firewall:group-form:preview', { n: matchingVms.value.length })
    : t('firewall:group-form:preview:interfaces', { n: interfaceCount, vms: matchingVms.value.length })
})

const { setNetworkTag } = useVdfNetworkTags()

const networkError = ref<string>()

// tags already used for the firewall on this XO's VMs
const suggestedTags = computed(() =>
  [...new Set(vms.value.flatMap(vm => vm.tags))]
    .filter(tag => tag.startsWith(VDF_TAG_PREFIX) && tag !== VDF_QUARANTINE_TAG && !form.tags.includes(tag))
    .sort()
)

const newTag = ref('')

function addTag(tag = newTag.value) {
  if (tag !== '' && !form.tags.includes(tag)) {
    form.tags.push(tag)
  }

  newTag.value = ''
}

function removeTag(tag: string) {
  form.tags = form.tags.filter(value => value !== tag)
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}(\/([12]?\d|3[0-2]))?$/

const IPV6 = /^[0-9a-f:]+:[0-9a-f:.]*(\/(12[0-8]|1[01]\d|[1-9]?\d))?$/i

const newIp = ref('')

const ipError = ref<{ content: string; accent: 'danger' }>()

function addIp() {
  ipError.value = undefined

  const ips = newIp.value.split(/[\s,]+/).filter(Boolean)
  const invalid = ips.filter(ip => !IPV4.test(ip) && !IPV6.test(ip))

  if (invalid.length > 0) {
    ipError.value = { content: t('firewall:group-form:ips:invalid', { ips: invalid.join(', ') }), accent: 'danger' }
    return
  }

  form.ips.push(...ips.filter(ip => !form.ips.includes(ip)))
  newIp.value = ''
}

function removeIp(ip: string) {
  form.ips = form.ips.filter(value => value !== ip)
}

const isNamedAsGlobal = computed(
  () => form.name !== '' && !isGlobalName(form.name) && otherGroupNames.includes(VDF_GLOBAL_PREFIX + form.name)
)

// in a pool, a global group reads by its global name: no local one may
// take it, or the two would read the same in rules
const takenNames = computed(() => ['any', ...otherGroupNames.map(displayName)])

const { useField, validate } = useValidatedForm(form, {
  errors: {
    onSubmit: () => ({
      name: {
        required: withMessage(required, () => t('firewall:group-form:name:required')),
        pattern: withMessage(regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/), () => t('firewall:group-form:name:invalid')),
        taken: withMessage(
          (value: unknown) => !takenNames.value.includes(String(value ?? '')),
          () =>
            isNamedAsGlobal.value
              ? t('firewall:group-form:name:global', { name: form.name })
              : t('firewall:group-form:name:taken')
        ),
      },
    }),
  },
})

const nameField = useField('name')

async function submit() {
  addTag()

  if (!(await validate()) || networkTagError.value !== undefined) {
    return
  }

  if (isScoped.value && (form.networkIds.length === 0 || form.networkTag === '')) {
    networkError.value = t('firewall:group-form:networks:required')
    return
  }

  const next: VdfGroup = omit(group, ['tags', 'ips', 'networks'])

  if (form.tags.length > 0) {
    next.tags = form.tags
  }

  if (form.ips.length > 0) {
    next.ips = form.ips
  }

  if (isScoped.value) {
    // the tag is the network set: the picked networks get it, the others
    // of the scope lose it (live, like VM tags)
    const tag = form.networkTag
    const picked = scopeNetworks.value.filter(network => form.networkIds.includes(network.id))
    const dropped = scopeNetworks.value.filter(
      network => !form.networkIds.includes(network.id) && network.tags.includes(tag)
    )

    try {
      networkError.value = undefined
      await setNetworkTag(picked, tag, true)

      if (dropped.length > 0) {
        await setNetworkTag(dropped, tag, false)
      }
    } catch (error) {
      networkError.value = error instanceof Error ? error.message : String(error)
      return
    }

    next.networks = [tag]
  }

  emit('confirm', form.name, next)
}
</script>

<style lang="postcss" scoped>
.vdf-group-drawer {
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

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .scope,
  .networks {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  /* under "Only interfaces on some networks", the box apart from its label */
  .networks {
    padding-inline-start: 2.4rem;

    :deep(.checkbox-label) {
      gap: 0.8rem;
    }
  }

  .network {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;
  }

  .vm-entry {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    width: 100%;

    .iface {
      padding-inline-start: 2.8rem;
    }
  }

  .chips,
  .vms,
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .add {
    display: flex;
    gap: 0.8rem;

    /* "Add tag", "Add IP" on one line */
    .ui-button {
      flex-shrink: 0;
      white-space: nowrap;
    }
  }

  .suggestion {
    position: relative;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;

    &:focus-visible {
      outline: none;

      &::before {
        content: '';
        position: absolute;
        inset: -0.4rem;
        border: 0.2rem solid var(--color-brand-txt-base);
        border-radius: 0.4rem;
      }
    }
  }

  .vm {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
