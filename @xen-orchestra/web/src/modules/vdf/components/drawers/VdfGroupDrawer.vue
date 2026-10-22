<template>
  <UiDrawer :title @confirm="submit()" @dismiss="emit('cancel')">
    <template #content>
      <div class="vdf-group-drawer">
        <VtsInputWrapper :label="t('firewall:group-form:name')" :message="nameError" wrap-message>
          <UiInput v-model.trim="form.name" :accent="nameError ? 'danger' : 'brand'" required placeholder="db" />
        </VtsInputWrapper>
        <UiInfo v-if="!isNew && form.name !== name" accent="info" wrap>
          {{ t('firewall:group-form:rename') }}
        </UiInfo>

        <section class="section">
          <UiLabel accent="neutral">{{ t('firewall:group-form:tags') }}</UiLabel>
          <UiInfo accent="muted" wrap>{{ t('firewall:group-form:tags:info') }}</UiInfo>
          <div class="chips">
            <UiChip v-for="tag of form.tags" :key="tag" accent="info" @remove="removeTag(tag)">{{ tag }}</UiChip>
          </div>
          <div class="add">
            <UiInput v-model.trim="newTag" accent="brand" placeholder="vdf:role=db" @keydown.enter.prevent="addTag()" />
            <UiButton variant="secondary" accent="brand" size="medium" left-icon="fa:plus" @click="addTag()">
              {{ t('firewall:add') }}
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
          <div class="chips">
            <UiChip v-for="ip of form.ips" :key="ip" accent="info" @remove="removeIp(ip)">{{ ip }}</UiChip>
          </div>
          <VtsInputWrapper :message="ipError" wrap-message>
            <div class="add">
              <UiInput
                v-model.trim="newIp"
                :accent="ipError ? 'danger' : 'brand'"
                placeholder="192.168.1.30, 10.0.0.0/8"
                @keydown.enter.prevent="addIp()"
              />
              <UiButton variant="secondary" accent="brand" size="medium" left-icon="fa:plus" @click="addIp()">
                {{ t('firewall:add') }}
              </UiButton>
            </div>
          </VtsInputWrapper>
        </section>

        <section class="section">
          <UiLabel accent="neutral">{{ t('firewall:group-form:preview', { n: matchingVms.length }) }}</UiLabel>
          <UiInfo v-if="form.tags.length === 0" accent="muted" wrap>
            {{ t('firewall:group-form:preview:no-tags') }}
          </UiInfo>
          <div v-else class="vms">
            <span v-for="vm of matchingVms" :key="vm.id" class="vm typo-body-regular-small">
              <VtsIcon :name="`object:vm:${vm.power_state.toLowerCase()}` as IconName" size="medium" />
              {{ vm.name_label }}
            </span>
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
import { VDF_QUARANTINE_TAG, VDF_TAG_PREFIX, type VdfGroup } from '@/modules/vdf/types.ts'
import { isVmInGroup } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { omit } from 'lodash-es'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { name, group, isNew, otherGroupNames } = defineProps<{
  name: string
  group: VdfGroup
  isNew: boolean
  otherGroupNames: string[]
}>()

const emit = defineEmits<{
  confirm: [name: string, group: VdfGroup]
  cancel: []
}>()

const { t } = useI18n()

const title = computed(() => (isNew ? t('firewall:group-form:new') : t('firewall:group-form:edit', { name })))

const form = reactive({
  name,
  tags: [...(group.tags ?? [])],
  ips: [...(group.ips ?? [])],
})

const { vms } = useXoVmCollection()

const matchingVms = computed(() => vms.value.filter(vm => isVmInGroup(vm.tags, { tags: form.tags })))

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

const submitted = ref(false)

const nameError = computed(() => {
  if (!submitted.value) {
    return undefined
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(form.name)) {
    return { content: t('firewall:group-form:name:invalid'), accent: 'danger' as const }
  }

  if (form.name === 'any' || otherGroupNames.includes(form.name)) {
    return { content: t('firewall:group-form:name:taken'), accent: 'danger' as const }
  }

  return undefined
})

function submit() {
  submitted.value = true
  addTag()

  if (nameError.value !== undefined) {
    return
  }

  const next: VdfGroup = omit(group, ['tags', 'ips'])

  if (form.tags.length > 0) {
    next.tags = form.tags
  }

  if (form.ips.length > 0) {
    next.ips = form.ips
  }

  emit('confirm', form.name, next)
}
</script>

<style lang="postcss" scoped>
.vdf-group-drawer {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
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
  }

  .suggestion {
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
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
