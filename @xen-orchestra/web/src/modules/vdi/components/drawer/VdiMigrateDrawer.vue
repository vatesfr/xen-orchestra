<template>
  <UiDrawer @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:migrate-vdi-on-sr') }}
    </template>

    <template #content>
      <div class="vdi-migrate-drawer-content">
        <UiTitle>{{ t('general-information') }}</UiTitle>
        <VdiFormSelect v-bind="srSelectBindings">
          <template #option="{ option }">
            <VtsOption :option>
              <span class="select-option">
                <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
                {{ option.properties.label }}
              </span>
            </VtsOption>
          </template>
        </VdiFormSelect>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />

      <VtsOverlayConfirmButton>
        {{ requiresForceMigrate ? t('action:force-migrate-on-sr') : t('action:migrate-vdi-on-sr') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import VdiFormSelect from '@/modules/vdi/components/form/shared/VdiFormSelect.vue'
import type { FormSelectId } from '@core/packages/form-select'
import type { FieldMetadata } from '@core/packages/validated-form'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { IK_OVERLAY_ACCENT } from '@core/utils/injection-keys.util.ts'
import { computed, provide } from 'vue'
import { useI18n } from 'vue-i18n'

const { requiresForceMigrate } = defineProps<{
  srSelectBindings: { id: FormSelectId; label: string } & FieldMetadata
  requiresForceMigrate: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

provide(
  IK_OVERLAY_ACCENT,
  computed(() => (requiresForceMigrate ? 'warning' : 'info'))
)
</script>

<style lang="postcss" scoped>
.vdi-migrate-drawer-content {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  text-align: left;
}

.select-option {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
