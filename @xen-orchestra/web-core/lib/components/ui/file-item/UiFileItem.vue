<!-- v1 -->
<template>
  <li class="ui-file-item">
    <div class="file">
      <VtsIcon size="current" :name="iconName" />
      <div v-tooltip="isNameTruncated ? file.name : false" class="name typo-body-bold">
        <span class="visually-hidden">{{ file.name }}</span>
        <span ref="nameHeadElement" aria-hidden="true" class="text-ellipsis">{{ nameParts.head }}</span>
        <span aria-hidden="true" class="tail">{{ nameParts.tail }}</span>
      </div>
      <div v-if="status === 'uploading'" class="actions">
        <UiLoader />
        <UiButtonIcon icon="action:close-cancel-clear" accent="brand" size="medium" @click="emit('cancel')" />
      </div>
      <div v-else-if="status === 'uploaded'" class="actions">
        {{ formattedSize }}
        <UiButtonIcon accent="danger" size="medium" icon="action:delete" @click="emit('delete')" />
      </div>
      <div v-else-if="status === 'error'" class="actions">
        <UiButton variant="tertiary" accent="brand" size="small" @click="emit('retry')">
          {{ t('retry') }}
        </UiButton>
      </div>
    </div>
    <UiInfo v-if="errors.length > 0" accent="danger" size="small" wrap>
      <span v-for="message of errors" :key="message" class="error">{{ message }}</span>
    </UiInfo>
  </li>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { hasEllipsis } from '@core/utils/has-ellipsis.util.ts'
import { formatSize } from '@core/utils/size.util.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { useResizeObserver } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

export type FileUploadStatus = 'uploading' | 'uploaded' | 'error'

const { file, status, error } = defineProps<{
  file: File
  status: FileUploadStatus
  error?: MaybeArray<string>
}>()

const emit = defineEmits<{
  retry: []
  cancel: []
  delete: []
}>()

const TAIL_BASE_NAME_LENGTH = 10

const { t } = useI18n()

const iconName = useMapper(
  () => status,
  {
    uploading: 'object:file',
    uploaded: 'object:file:success',
    error: 'object:file:error',
  },
  'uploading'
)

const nameParts = computed(() => {
  const { name } = file
  const extensionIndex = name.lastIndexOf('.')
  const extensionLength = extensionIndex === -1 ? 0 : name.length - extensionIndex
  const tailLength = extensionLength + TAIL_BASE_NAME_LENGTH

  return {
    head: name.slice(0, -tailLength),
    tail: name.slice(-tailLength),
  }
})

const nameHeadElement = useTemplateRef('nameHeadElement')

const isNameTruncated = ref(false)

useResizeObserver(nameHeadElement, ([entry]) => {
  isNameTruncated.value = hasEllipsis(entry.target)
})

const formattedSize = computed(() => formatSize(file.size, 2))

const errors = computed(() => toArray(error).filter(message => message !== ''))
</script>

<style lang="postcss" scoped>
.ui-file-item {
  display: flex;
  min-width: 32rem;
  max-width: 100%;
  flex-direction: column;
  gap: 0.4rem;

  .file {
    display: flex;
    align-items: center;
    gap: 1.6rem;
    padding: 1.6rem;
    background-color: var(--color-neutral-background-primary);
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.4rem;
    color: var(--color-neutral-txt-primary);

    .name {
      display: flex;
      flex: 1;
      min-width: 0;

      .tail {
        flex-shrink: 0;
        white-space: nowrap;
      }
    }

    .actions {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      gap: 1.6rem;
    }
  }

  .error {
    display: block;
  }
}
</style>
