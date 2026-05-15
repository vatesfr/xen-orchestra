<template>
  <!--  TODO Replace with the component upload file when available -->
  <VtsInputWrapper :label="t('file')" :message>
    <div
      class="dropzone"
      :class="{ dragging, 'with-file': model !== undefined }"
      role="button"
      tabindex="0"
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="handleDrop"
    >
      <template v-if="model === undefined">
        <VtsIcon name="fa:arrow-up" size="large" />
        <div class="primary typo-body-regular-em">{{ t('new-vdi:click-to-upload') }}</div>
        <div class="secondary typo-caption-regular">{{ t('new-vdi:accepted-formats', { formats: formatsLabel }) }}</div>
      </template>
      <template v-else>
        <VtsIcon name="fa:file" size="medium" />
        <span class="filename typo-body-regular text-ellipsis">{{ model.name }}</span>
        <span class="filesize typo-caption-regular">{{ formattedSize }}</span>
        <UiButtonIcon
          icon="fa:trash"
          accent="brand"
          size="small"
          @click.stop="clear"
          @keydown.enter.stop.prevent="clear"
        />
      </template>
    </div>
    <input ref="inputRef" type="file" class="hidden-input" :accept="acceptAttribute" @change="handlePick" />
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { acceptedExtensions = [] } = defineProps<{
  message?: InputWrapperMessage
  acceptedExtensions?: readonly string[]
}>()

const model = defineModel<File | undefined>()

const acceptAttribute = computed(() => acceptedExtensions.join(','))

const formatsLabel = computed(() =>
  acceptedExtensions.map(extension => extension.replace(/^\./, '').toUpperCase()).join(', ')
)

const { t } = useI18n()

const inputRef = ref<HTMLInputElement>()
const dragging = ref(false)

const formattedSize = computed(() => {
  if (model.value === undefined) {
    return ''
  }
  const { value, prefix } = formatSizeRaw(model.value.size, 2)
  return `${value} ${prefix}`
})

function openPicker() {
  inputRef.value?.click()
}

function handlePick(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file !== undefined) {
    model.value = file
  }
  target.value = ''
}

function handleDrop(event: DragEvent) {
  dragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file !== undefined) {
    model.value = file
  }
}

function clear() {
  model.value = undefined
}
</script>

<style lang="postcss" scoped>
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  border: 0.1rem dashed var(--color-neutral-border);
  border-radius: 0.4rem;
  background-color: var(--color-neutral-background-secondary);
  color: var(--color-neutral-txt-secondary);
  padding: 2.4rem;
  min-height: 12rem;
  cursor: pointer;
  transition:
    border-color 0.125s ease-in-out,
    background-color 0.125s ease-in-out;

  &:hover,
  &:focus-visible,
  &.dragging {
    border-color: var(--color-brand-item-base);
    background-color: var(--color-neutral-background-disabled);
    outline: none;
  }

  &.with-file {
    flex-direction: row;
    justify-content: flex-start;
    min-height: auto;
    padding: 1.2rem 1.6rem;

    .filename {
      flex: 1;
      min-width: 0;
      color: var(--color-neutral-txt-primary);
    }

    .filesize {
      color: var(--color-neutral-txt-secondary);
    }
  }

  .primary {
    color: var(--color-neutral-txt-primary);
  }
}

.hidden-input {
  display: none;
}
</style>
