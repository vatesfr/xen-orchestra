<!-- v2 -->
<template>
  <div class="ui-file-uploader" :class="className">
    <button
      :id="wrapperController?.id"
      ref="dropZoneRef"
      type="button"
      class="dropzone"
      :class="{ 'is-over-dropzone': isOverDropZone }"
      :disabled="isDisabled"
      @click="open()"
    >
      <VtsIcon name="fa:upload" size="large" class="icon" />
      <div class="text">
        {{ t('click-to-upload-or-drag-and-drop') }}
        <span class="hint">{{ hint }}</span>
      </div>
    </button>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import { useInputWrapperController } from '@core/composables/input-wrapper-controller.composable.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { formatSize } from '@core/utils/size.util.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { useDropZone, useFileDialog } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

export type FileUploaderAccent = 'neutral' | 'warning' | 'danger'

export type FileRejection = {
  file: File
  reason: 'type' | 'size'
}

const {
  accent: rawAccent,
  disabled,
  maxSize,
  accept = '*/*',
  acceptLabel,
  multiple,
  required,
} = defineProps<{
  accent: FileUploaderAccent
  maxSize?: number
  accept?: MaybeArray<string>
  acceptLabel?: string
  multiple?: boolean
  required?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  select: [files: File[]]
  reject: [rejections: FileRejection[]]
}>()

const { t } = useI18n()

const { wrapperController, accent } = useInputWrapperController({
  accent: () => rawAccent,
  required: () => required,
})

const isDisabled = useDisabled(() => disabled)

const className = computed(() => toVariants({ accent: accent.value, disabled: isDisabled.value }))

const acceptedTypes = computed(() => {
  const types = toArray(accept)

  if (types.length === 0) {
    return ['*/*']
  }

  return types.map(type => (type === '*' ? '*/*' : type))
})

const acceptedTypesLabel = computed(() => {
  if (acceptLabel) {
    return acceptLabel
  }

  if (acceptedTypes.value.length === 1 && acceptedTypes.value[0] === '*/*') {
    return t('any-file-type')
  }

  return acceptedTypes.value.join(', ')
})

const hint = computed(() => {
  if (maxSize) {
    return t('file-types-and-max-size', { types: acceptedTypesLabel.value, size: formatSize(maxSize, 0) })
  }

  return acceptedTypesLabel.value
})

// Handle File Dialog on click
const { open, onChange } = useFileDialog({
  accept: computed(() => acceptedTypes.value.join(',')),
  multiple: computed(() => multiple),
  // without it, re-picking the same file does not fire `change` and no event is emitted
  reset: true,
})

onChange(handleFiles)

// Handle Drop zone for drag and drop
const dropZoneRef = useTemplateRef('dropZoneRef')

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: handleFiles,
  // VueUse bug: `multiple: false` and `dataTypes` reject the whole drag, so both are enforced in `handleFiles` instead
  multiple: true,
  preventDefaultForUnhandled: true,
})

function isFileTypeAccepted(file: File) {
  return acceptedTypes.value.some(acceptedType => {
    if (acceptedType === '*/*') {
      return true
    }

    if (acceptedType.startsWith('.')) {
      return file.name.toLowerCase().endsWith(acceptedType.toLowerCase())
    }

    if (acceptedType.endsWith('/*')) {
      return file.type.startsWith(acceptedType.slice(0, -1))
    }

    return file.type === acceptedType
  })
}

function getRejectionReason(file: File): FileRejection['reason'] | undefined {
  if (!isFileTypeAccepted(file)) {
    return 'type'
  }

  if (maxSize !== undefined && file.size > maxSize) {
    return 'size'
  }
}

function handleFiles(files: File[] | FileList | null) {
  if (isDisabled.value || !files) {
    return
  }

  const selectedFiles: File[] = []
  const rejections: FileRejection[] = []

  for (const file of files) {
    const reason = getRejectionReason(file)

    if (reason === undefined) {
      selectedFiles.push(file)
    } else {
      rejections.push({ file, reason })
    }
  }

  if (selectedFiles.length > 0) {
    emit('select', multiple ? selectedFiles : selectedFiles.slice(0, 1))
  }

  if (rejections.length > 0) {
    emit('reject', rejections)
  }
}
</script>

<style lang="postcss" scoped>
.ui-file-uploader {
  display: flex;
  flex-direction: column;
  color: var(--color-neutral-txt-primary);

  .dropzone {
    height: 20rem;
    border-radius: 0.4rem;
    border: 0.1rem dashed;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 1.6rem 0.8rem;
    outline: none;

    .icon {
      margin-block-end: 1.6rem;
    }

    .text {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--color-neutral-txt-primary);

      .hint {
        color: var(--color-neutral-txt-secondary);
      }
    }
  }

  /* ACCENT */
  &:not(.disabled) {
    .dropzone:focus-visible {
      border-width: 0.2rem;
    }

    &.accent--neutral {
      .dropzone {
        border-color: var(--color-neutral-txt-secondary);
        background-color: var(--color-brand-background-selected);

        &:hover,
        &.is-over-dropzone {
          background-color: var(--color-brand-background-hover);
          border-color: var(--color-brand-txt-hover);
        }

        &:focus-visible {
          background-color: var(--color-neutral-background-primary);
          border-color: var(--color-brand-txt-base);
        }

        &:active {
          background-color: var(--color-brand-background-active);
          border-color: var(--color-brand-txt-active);
        }
      }
    }

    &.accent--warning {
      .dropzone {
        border-color: var(--color-warning-txt-base);
        background-color: var(--color-warning-background-selected);

        &:hover,
        &.is-over-dropzone {
          background-color: var(--color-warning-background-hover);
          border-color: var(--color-warning-txt-hover);
        }

        &:focus-visible {
          background-color: var(--color-neutral-background-primary);
          border-color: var(--color-warning-txt-base);
        }

        &:active {
          background-color: var(--color-warning-background-active);
          border-color: var(--color-warning-txt-active);
        }
      }
    }

    &.accent--danger {
      .dropzone {
        border-color: var(--color-danger-txt-base);
        background-color: var(--color-danger-background-selected);

        &:hover,
        &.is-over-dropzone {
          background-color: var(--color-danger-background-hover);
          border-color: var(--color-danger-txt-hover);
        }

        &:focus-visible {
          background-color: var(--color-neutral-background-primary);
          border-color: var(--color-danger-txt-base);
        }

        &:active {
          background-color: var(--color-danger-background-active);
          border-color: var(--color-danger-txt-active);
        }
      }
    }
  }

  /* DISABLED */
  &.disabled {
    .dropzone {
      background-color: var(--color-neutral-background-disabled);
      border-color: var(--color-neutral-txt-secondary);
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
