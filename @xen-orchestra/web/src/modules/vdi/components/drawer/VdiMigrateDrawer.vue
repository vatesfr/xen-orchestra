<template>
  <VtsDrawer dismissible is-open @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:migrate-vdi-on-sr') }}
    </template>

    <template #content>
      <div class="form">
        <p class="section-title">{{ t('general-information') }}</p>

        <div class="field">
          <VtsInputWrapper :label="t('destination-sr')" :message="srMessages" wrap-message>
            <VtsSelect :id="srSelect.id" :accent="srSelectAccent">
              <template #default="{ option }">
                <VtsOption :option="option">
                  <div class="sr-option">
                    <VtsIcon :name="option.properties.icon" size="medium" />

                    <span class="sr-option__label">
                      <span>{{ option.properties.label }}</span>
                    </span>
                  </div>
                </VtsOption>
              </template>
            </VtsSelect>
          </VtsInputWrapper>
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsDrawerCancelButton />

      <template v-if="!showError">
        <UiButton v-if="isOnDifferentHost" accent="warning" variant="primary" size="medium" @click="handleConfirm">
          {{ t('action:force-migrate-on-sr') }}
        </UiButton>

        <VtsDrawerConfirmButton v-else @click="handleConfirm">
          {{ isOnDifferentHost ? t('action:force-migrate-on-sr') : t('action:migrate-vdi-on-sr') }}
        </VtsDrawerConfirmButton>
      </template>
    </template>
  </VtsDrawer>
</template>

<script lang="ts" setup>
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.js'
import type { DropdownAccent } from '@core/components/ui/dropdown/UiDropdown.vue'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { type IconName } from '@core/icons'
import { useFormSelect } from '@core/packages/form-select'
import { formatSize } from '@core/utils/size.util.ts'
import VtsDrawer from '@xen-orchestra/web-core/components/drawer/VtsDrawer.vue'
import VtsDrawerCancelButton from '@xen-orchestra/web-core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@xen-orchestra/web-core/components/drawer/VtsDrawerConfirmButton.vue'
import VtsIcon from '@xen-orchestra/web-core/components/icon/VtsIcon.vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vdi: FrontXoVdi
}>()

const emit = defineEmits<{
  confirm: [srId: string]
  cancel: []
}>()

type SrOptionProperties = {
  sr: FrontXoSr
  label: string
  location: string
  freeSizeLabel: string
  icon: IconName
  accent?: DropdownAccent
}

const { t } = useI18n()

const { srs, useGetSrById } = useXoSrCollection()
const { getSrLocation } = useXoSrUtils()
const { getPbdsByIds } = useXoPbdCollection()

const destinationSrId = ref<FrontXoSr['id']>()
const showError = ref(false)

// Exclude the VDI's current SR
const availableSrs = computed(() => srs.value.filter((sr: FrontXoSr) => sr.id !== props.vdi.$SR))

function getSrFreeSize(sr: FrontXoSr) {
  return Math.max(sr.size - sr.physical_usage, 0)
}

function getSrStatusIcon(sr: FrontXoSr): IconName {
  const pbds = getPbdsByIds(sr.$PBDs)

  if (pbds.length === 0) {
    return 'object:sr:unknown'
  }

  if (pbds.every(pbd => !pbd.attached)) {
    return 'object:sr:disconnected'
  }

  if (pbds.some(pbd => !pbd.attached)) {
    return 'object:sr:partially-connected'
  }

  return 'object:sr:connected'
}

function getCleanSrNameLabel(sr: FrontXoSr) {
  return sr.name_label.replace(/[🌎❗!]/gu, '').trim()
}

function getSrOptionLabel(sr: FrontXoSr) {
  const name = getCleanSrNameLabel(sr)
  const location = getSrLocation(sr)
  const freeSize = formatSize(getSrFreeSize(sr), 0)

  return `${name} (${location}) - ${freeSize} left`
}

const srSelect = useFormSelect<FrontXoSr, SrOptionProperties, 'id'>(availableSrs, {
  model: destinationSrId,
  required: true,
  searchable: true,
  placeholder: () => t('action:select-storage'),
  option: {
    value: 'id',
    label: sr => getSrOptionLabel(sr),
    selectedLabel: sr => getSrOptionLabel(sr),
    searchableTerm: sr => [getCleanSrNameLabel(sr), getSrLocation(sr), formatSize(getSrFreeSize(sr), 0)],
    properties: sr => ({
      sr,
      label: getSrOptionLabel(sr),
      location: getSrLocation(sr),
      freeSizeLabel: formatSize(getSrFreeSize(sr), 0),
      icon: getSrStatusIcon(sr),
      accent: 'normal',
    }),
  },
})

const currentSr = useGetSrById(() => props.vdi.$SR)

const selectedSrId = computed(() => destinationSrId.value)

const selectedSr = useGetSrById(selectedSrId)

// SR is on a different host when $container differs from the current SR's $container
const isOnDifferentHost = computed(() => {
  if (!selectedSr.value || !currentSr.value) return false
  return selectedSr.value.$container !== currentSr.value.$container
})

const srSelectAccent = computed(() => {
  if (showError.value) {
    return 'danger'
  }

  if (isOnDifferentHost.value) {
    return 'warning'
  }

  return 'brand'
})

const srMessages = computed<InputWrapperMessage | undefined>(() => {
  if (showError.value) {
    return {
      content: t('destination-sr-mandatory'),
      accent: 'danger',
    }
  }

  if (isOnDifferentHost.value) {
    return {
      content: t('vdi-on-different-sr-warning'),
      accent: 'warning',
    }
  }

  return undefined
})

watch(destinationSrId, () => {
  showError.value = false
})

function handleConfirm() {
  const srId = selectedSrId.value
  if (srId === undefined) {
    showError.value = true
    return
  }
  showError.value = false
  emit('confirm', srId)
}
</script>

<style lang="postcss" scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  width: 100%;
  text-align: left;
}

.section-title {
  font-weight: 600;
  color: var(--color-brand-txt-base);
  border-bottom: 0.1rem solid var(--color-brand-txt-base);
  padding-bottom: 0.8rem;
  width: 100%;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.sr-option {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.sr-option__label {
  overflow: hidden;
  min-width: 0;
  color: var(--color-neutral-txt-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
