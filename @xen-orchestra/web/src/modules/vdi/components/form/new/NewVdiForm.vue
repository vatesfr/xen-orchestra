<template>
  <form class="new-vdi-form" @submit.prevent="onSubmit()">
    <div class="section">
      <UiTitle>{{ t('general-information') }}</UiTitle>

      <NewVdiSourceSelector v-model="source" />

      <NewVdiFileDropzone
        v-if="source === 'file'"
        v-model="file"
        :accepted-extensions="acceptedFileExtensions"
        :message="dropzoneMessage"
      />

      <VdiFormTextInput v-if="source === 'url'" v-bind="urlInputBindings" />

      <template v-if="showRemainingFields">
        <div class="row">
          <VdiFormTextInput v-bind="nameInputBindings" />
          <VdiFormDescriptionTextarea v-bind="descriptionInputBindings" />
        </div>

        <div class="row">
          <VdiFormSelect v-bind="srSelectBindings" />
          <NewVdiAllocatedSpaceInput v-bind="allocatedSpaceBindings" />
        </div>
      </template>
    </div>

    <div v-if="showRemainingFields" class="section">
      <UiTitle>{{ t('options') }}</UiTitle>
      <UiCheckbox v-model="readOnly" accent="brand">
        {{ t('read-only') }}
      </UiCheckbox>
      <UiCheckbox v-model="bootable" accent="brand" :disabled="!isPv">
        {{ t('bootable') }}
        <template #info>
          <span class="checkbox-info">{{ t('pv-vms-only') }}</span>
        </template>
      </UiCheckbox>
    </div>

    <div class="buttons-container">
      <UiLink :to="cancelTo" size="medium">{{ t('cancel') }}</UiLink>
      <UiButton type="submit" size="medium" accent="brand" variant="primary" :disabled="!canSubmit">
        {{ t('action:create') }}
      </UiButton>
    </div>
  </form>
</template>

<script lang="ts" setup>
import VdiFormDescriptionTextarea from '@/modules/vdi/components/form/new/inputs/VdiFormDescriptionTextarea.vue'
import VdiFormSelect from '@/modules/vdi/components/form/new/inputs/VdiFormSelect.vue'
import VdiFormTextInput from '@/modules/vdi/components/form/new/inputs/VdiFormTextInput.vue'
import NewVdiAllocatedSpaceInput from '@/modules/vdi/components/form/new/NewVdiAllocatedSpaceInput.vue'
import NewVdiFileDropzone from '@/modules/vdi/components/form/new/NewVdiFileDropzone.vue'
import NewVdiSourceSelector from '@/modules/vdi/components/form/new/NewVdiSourceSelector.vue'
import { useNewVdiForm } from '@/modules/vdi/form/new/use-new-vdi-form.ts'
import type { NewVdiPayload } from '@/modules/vdi/jobs/xo-vdi-create.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

const { vm } = defineProps<{
  vm: FrontXoVm
  cancelTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  create: [data: NewVdiPayload]
}>()

const { t } = useI18n()

const {
  source,
  srSelectBindings,
  nameInputBindings,
  descriptionInputBindings,
  allocatedSpaceBindings,
  urlInputBindings,
  readOnly,
  bootable,
  file,
  isPv,
  acceptedFileExtensions,
  isFileCompatibleWithSr,
  canSubmit,
  validateAndBuildPayload,
} = useNewVdiForm(() => vm)

const dropzoneMessage = computed(() =>
  !isFileCompatibleWithSr.value
    ? { content: t('new-vdi:file-incompatible-with-sr'), accent: 'danger' as const }
    : undefined
)

const showRemainingFields = computed(() => {
  if (source.value === 'empty') {
    return true
  }
  if (source.value === 'file') {
    return file.value !== undefined
  }
  return urlInputBindings.value.modelValue.trim() !== ''
})

function onSubmit() {
  const payload = validateAndBuildPayload()
  if (payload !== undefined) {
    emit('create', payload)
  }
}
</script>

<style lang="postcss" scoped>
.new-vdi-form {
  display: flex;
  flex-direction: column;
  gap: 4rem;

  .section {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

  .row {
    display: flex;
    align-items: start;
    flex-direction: column;
    gap: 2.4rem;

    & > * {
      width: 100%;
      min-width: 0;
    }

    @media (--medium-or-large) {
      flex-direction: row;
      gap: 8rem;
      max-width: 88rem;
    }
  }

  .buttons-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2.4rem;
  }
}
</style>
