<template>
  <div class="backup-job-form-long-term-retention-row">
    <div class="row typo-body-regular">
      <I18nT keypath="long-term-retention:row" scope="global">
        <template #count>
          <span class="count">
            <UiInput v-model.number="retention" :accent="errorMessages.length > 0 ? 'danger' : 'brand'" type="number" />
          </span>
        </template>
        <template #period>
          <span class="typo-body-bold">{{ period }}</span>
        </template>
        <template #keep>
          <span class="keep">
            <VtsSelect :id="keepSelectId" accent="brand" />
          </span>
        </template>
      </I18nT>
    </div>
    <UiInfo v-for="message of errorMessages" :key="message" accent="danger" wrap>
      {{ message }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import { toErrorMessages } from '@/modules/backup-job/utils/backup-job-error-messages.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { FormSelectId } from '@core/packages/form-select'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { computed } from 'vue'
import { I18nT } from 'vue-i18n'

const { error } = defineProps<{
  period: string
  keepSelectId: FormSelectId
  error?: InputWrapperMessage
}>()

const retention = defineModel<number | undefined>({ required: true })

const errorMessages = computed(() => toErrorMessages(error))
</script>

<style lang="postcss" scoped>
.backup-job-form-long-term-retention-row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.8rem 1.6rem;
  }

  .count {
    flex: 0 0 10rem;
    width: 10rem;
  }

  .keep {
    flex: 0 0 18rem;
    width: 18rem;
  }
}
</style>
