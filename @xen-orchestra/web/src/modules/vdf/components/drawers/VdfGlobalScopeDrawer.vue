<template>
  <UiDrawer class="vdf-global-scope-drawer" @confirm="submit()" @dismiss="emit('cancel')">
    <template #title>{{ t('firewall:global:scope:change') }}</template>

    <template #content>
      <div class="fields">
        <UiAlert accent="info">{{ t('firewall:global:scope:info') }}</UiAlert>

        <UiRadioButtonGroup :label="t('firewall:global:scope')" accent="brand" gap="narrow" vertical>
          <UiRadioButton v-model="mode" value="all" accent="brand">
            {{ t('firewall:global:scope:all', { n: pools.length }) }}
          </UiRadioButton>
          <UiRadioButton v-model="mode" value="selected" accent="brand">
            {{ t('firewall:global:scope:selected') }}
          </UiRadioButton>
        </UiRadioButtonGroup>

        <div v-if="mode === 'selected'" class="pools" role="group" :aria-label="t('firewall:global:scope:selected')">
          <UiCheckbox
            v-for="pool of pools"
            :key="pool.id"
            accent="brand"
            :model-value="selected.has(pool.id)"
            @update:model-value="checked => togglePool(pool.id, checked === true)"
          >
            {{ pool.name }}
          </UiCheckbox>
          <UiAlert v-if="selected.size === 0" accent="warning">{{ t('firewall:global:scope:empty') }}</UiAlert>
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('firewall:save-to-draft') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import type { VdfGlobalPool, VdfGlobalScope } from '@/modules/vdf/types.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Where the global configuration applies: every pool (also those connected
// later), or a selection. Part of the draft, published with the rest.
const { pools, scope } = defineProps<{
  pools: VdfGlobalPool[]
  // the scope as currently drafted
  scope: VdfGlobalScope
}>()

const emit = defineEmits<{
  confirm: [scope: VdfGlobalScope]
  cancel: []
}>()

const { t } = useI18n()

const mode = ref<'all' | 'selected'>(scope.all ? 'all' : 'selected')

// switching to a selection starts from the pools currently in scope
const selected = ref(new Set(scope.all ? pools.filter(pool => pool.inScope).map(pool => pool.id) : (scope.pools ?? [])))

function togglePool(poolId: string, checked: boolean) {
  const next = new Set(selected.value)

  if (checked) {
    next.add(poolId)
  } else {
    next.delete(poolId)
  }

  selected.value = next
}

function submit() {
  emit('confirm', mode.value === 'all' ? { all: true } : { pools: [...selected.value] })
}
</script>

<style lang="postcss" scoped>
.vdf-global-scope-drawer {
  .fields,
  .pools {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .pools {
    gap: 0.8rem;
  }
}
</style>
