<template>
  <VtsForm class="new-sr-form">
    <UiTitle>{{ t('general-information') }}</UiTitle>
    <div class="row">
      <NewSrFormTextInput v-bind="nameInputBindings" />
      <NewSrFormTextarea v-bind="descriptionInputBindings" />
    </div>
    <div class="row">
      <NewSrAccessModeSelector v-bind="accessModeInputBindings" />
      <div class="pool-host-dropdowns">
        <NewSrFormSelect v-bind="poolSelectBindings" />
        <NewSrFormSelect v-bind="hostSelectBindings">
          <template #option="{ option }">
            <VtsOption :option>
              <span class="option-content">
                <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
                {{ option.properties.label }}
              </span>
            </VtsOption>
          </template>
        </NewSrFormSelect>
      </div>
    </div>
  </VtsForm>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import NewSrFormSelect from '@/modules/storage-repository/components/form/new/inputs/NewSrFormSelect.vue'
import NewSrFormTextarea from '@/modules/storage-repository/components/form/new/inputs/NewSrFormTextarea.vue'
import NewSrFormTextInput from '@/modules/storage-repository/components/form/new/inputs/NewSrFormTextInput.vue'
import NewSrAccessModeSelector from '@/modules/storage-repository/components/form/new/NewSrAccessModeSelector.vue'
import { useNewSrForm } from '@/modules/storage-repository/form/new/use-new-sr-form.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { poolId, hostId } = defineProps<{
  poolId: FrontXoPool['id']
  hostId?: FrontXoHost['id']
}>()

const { t } = useI18n()

const {
  poolSelectBindings,
  hostSelectBindings,
  accessModeInputBindings,
  nameInputBindings,
  descriptionInputBindings,
  validate,
} = useNewSrForm(
  () => poolId,
  () => hostId
)

defineExpose({ validate })
</script>

<style lang="postcss" scoped>
.new-sr-form {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

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
      gap: 2.4rem;
      max-width: 88rem;
    }
  }

  .pool-host-dropdowns {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .option-content {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
