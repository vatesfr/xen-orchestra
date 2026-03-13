<template>
  <div class="duplicate">
    <form @submit.prevent="handleDuplicate()">
      <UiCard>
        <UiTitle>{{ t('general-information') }}</UiTitle>
        <VtsInputWrapper
          :label="t('duplicate-vm:name')"
          :message="isDuplicateVmNameEmpty ? { content: t('duplicate-vm:name-required'), accent: 'danger' } : undefined"
        >
          <UiInput v-model.trim="duplicateVmName" required :accent="isDuplicateVmNameEmpty ? 'danger' : 'brand'" />
        </VtsInputWrapper>

        <UiTitle class="options-title">{{ t('options') }}</UiTitle>
        <UiRadioButtonGroup
          :label="t('duplicate-vm:duplication-method')"
          accent="brand"
          :gap="uiStore.isSmall ? 'narrow' : 'wide'"
        >
          <UiRadioButton
            v-model="copyMode"
            :disabled="vm.power_state !== VM_POWER_STATE.HALTED"
            accent="brand"
            value="fastClone"
          >
            {{ t('duplicate-vm:fast-clone') }}
          </UiRadioButton>
          <UiRadioButton v-model="copyMode" accent="brand" value="fullCopy">
            {{ t('duplicate-vm:full-copy') }}
          </UiRadioButton>
          <template #info>
            <UiInfo accent="info">
              {{ t('duplicate-vm:fast-clone-available') }}
            </UiInfo>
          </template>
        </UiRadioButtonGroup>

        <div v-if="copyMode === 'fullCopy'" class="full-copy">
          <VtsInputWrapper
            :label="t('storage-repository')"
            :message="isSrEmpty ? { content: t('duplicate-vm:sr-required'), accent: 'danger' } : undefined"
          >
            <VtsSelect :id="srSelectId" :accent="isSrEmpty ? 'danger' : 'brand'" />
          </VtsInputWrapper>

          <div class="compression">
            <UiLabel accent="neutral">{{ t('compression') }}</UiLabel>
            <UiInfo accent="info">{{ t('duplicate-vm:compression-available') }}</UiInfo>
          </div>

          <!--        TODO: uncommented when XO6 license management is available -->

          <!--          <UiRadioButtonGroup :label="t('compression')" accent="brand" :gap="uiStore.isSmall ? 'narrow' : 'wide'"> -->
          <!--            <UiRadioButton v-model="compressionMode" accent="brand" value="disabled">{{ t('disabled') }}</UiRadioButton> -->
          <!--            <UiRadioButton v-model="compressionMode" accent="brand" value="gzip"> -->
          <!--              {{ t('duplicate-vm:compression-gzip') }} -->
          <!--            </UiRadioButton> -->
          <!--            <UiRadioButton v-model="compressionMode" accent="brand" value="zstd"> -->
          <!--              {{ t('duplicate-vm:compression-zstd') }} -->
          <!--            </UiRadioButton> -->
          <!--          </UiRadioButtonGroup> -->
        </div>

        <div class="footer">
          <UiButton variant="secondary" accent="brand" size="medium" @click="router.back()">
            {{ t('cancel') }}
          </UiButton>
          <UiButton
            variant="primary"
            accent="brand"
            size="medium"
            type="submit"
            :disabled="!canDuplicate"
            :busy="duplicateJob.isRunning.value"
          >
            {{ t('action:duplicate') }}
          </UiButton>
        </div>
      </UiCard>
    </form>
  </div>
</template>

<script setup lang="ts">
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { type DuplicateVmPayload, useXoVmDuplicateJob } from '@/modules/vm/jobs/xo-vm-duplicate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useFormSelect } from '@core/packages/form-select'
import { useUiStore } from '@core/stores/ui.store.ts'
import { VM_POWER_STATE } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { vm } = defineProps<{ vm: FrontXoVm }>()

const { t } = useI18n()

const uiStore = useUiStore()

const router = useRouter()

const duplicateVmName = ref(`${vm.name_label}_COPY`)

const copyMode = ref<'fastClone' | 'fullCopy'>(vm.power_state === VM_POWER_STATE.HALTED ? 'fastClone' : 'fullCopy')

// const compressionMode = ref<'disabled' | 'gzip' | 'zstd'>('disabled')

const selectedSr = ref<FrontXoSr | undefined>()

const isDuplicateVmNameEmpty = computed(() => duplicateVmName.value.trim() === '')

const isSrEmpty = computed(() => copyMode.value === 'fullCopy' && selectedSr.value === undefined)

const { srs } = useXoSrCollection()

const filteredSrs = computed(() => {
  return srs.value.filter(sr => sr.content_type !== 'iso' && sr.size > 0 && sr.$pool === vm.$pool)
})

const { id: srSelectId } = useFormSelect(filteredSrs, {
  model: selectedSr,
  option: {
    label: sr => {
      const gbLeft = Math.floor((sr.size - sr.physical_usage) / 1024 ** 3)
      return `${sr.name_label} - ${t('n-gb-left', { n: gbLeft })}`
    },
  },
})

const payload = computed<DuplicateVmPayload>(() => {
  if (copyMode.value === 'fastClone' || selectedSr.value === undefined) {
    return { name_label: duplicateVmName.value, fast: true }
  }
  return { name_label: duplicateVmName.value, srId: selectedSr.value.id }
})

const duplicateJob = useXoVmDuplicateJob(() => vm, payload)

const canDuplicate = computed(() => duplicateJob.canRun.value && !isDuplicateVmNameEmpty.value && !isSrEmpty.value)

async function handleDuplicate() {
  if (!canDuplicate.value) return

  await duplicateJob.run()
}
</script>

<style scoped lang="postcss">
.duplicate {
  margin: 0.8rem;

  .options-title {
    margin-top: 4rem;
  }

  .full-copy {
    display: flex;
    align-items: flex-start;
    gap: 2.4rem;

    .compression {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
  }

  .footer {
    display: flex;
    justify-content: center;
    gap: 1.6rem;
  }
}
</style>
