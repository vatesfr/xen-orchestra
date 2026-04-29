<template>
  <form class="vdi-attach-form" @submit.prevent="onSubmit()">
    <div class="attach-form">
      <UiTitle>{{ t('general-information') }}</UiTitle>
      <div class="row">
        <VtsInputWrapper :label="srSelectBindings.label" :message="srMessage">
          <VtsSelect :id="srSelectBindings.id" accent="brand" />
        </VtsInputWrapper>
        <VtsInputWrapper :label="vdiSelectBindings.label" :message="vdiMessage">
          <VtsSelect :id="vdiSelectBindings.id" accent="brand" />
        </VtsInputWrapper>
      </div>
    </div>
    <div class="attach-form">
      <UiTitle>{{ t('options') }}</UiTitle>
      <div class="checkbox">
        <UiCheckbox v-model="readOnly" accent="brand">
          {{ t('read-only') }}
        </UiCheckbox>
        <span v-tooltip="!isPv && t('paravirtualized-vms-only')">
          <UiCheckbox v-model="bootable" accent="brand" :disabled="!isPv">
            {{ t('bootable') }}
          </UiCheckbox>
        </span>
      </div>
    </div>
    <div class="buttons-container">
      <UiLink :to="cancelTo" size="medium">
        {{ t('cancel') }}
      </UiLink>
      <UiButton type="submit" size="medium" accent="brand" variant="primary" :disabled="!canSubmit">
        {{ t('action:attach') }}
      </UiButton>
    </div>
  </form>
</template>

<script lang="ts" setup>
import type { NewVbdPayload } from '@/modules/vbd/jobs/xo-vbd-create.job.ts'
import { useVdiAttachForm } from '@/modules/vdi/form/attach/use-vdi-attach-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

const { vm } = defineProps<{
  vm: FrontXoVm
  cancelTo: RouteLocationRaw
}>()

const emit = defineEmits<{
  attach: [data: NewVbdPayload]
}>()

const { t } = useI18n()

const { srSelectBindings, vdiSelectBindings, readOnly, bootable, isPv, canSubmit, validateAndBuildPayload } =
  useVdiAttachForm(() => vm)

const srMessage = computed<InputWrapperMessage | undefined>(() =>
  srSelectBindings.value.warning ? { content: srSelectBindings.value.warning, accent: 'warning' } : undefined
)

const vdiMessage = computed<InputWrapperMessage | undefined>(() =>
  vdiSelectBindings.value.warning ? { content: vdiSelectBindings.value.warning, accent: 'warning' } : undefined
)

function onSubmit() {
  const payload = validateAndBuildPayload()

  if (payload !== undefined) {
    emit('attach', payload)
  }
}
</script>

<style lang="postcss" scoped>
.vdi-attach-form {
  display: flex;
  flex-direction: column;
  gap: 4rem;

  .attach-form {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

  .checkbox {
    display: flex;
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
