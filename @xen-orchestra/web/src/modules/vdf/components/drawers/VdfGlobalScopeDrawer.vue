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
          <span v-if="mode === 'all'" class="hint typo-body-regular-small">
            {{ t('firewall:global:scope:all:info') }}
          </span>
          <UiRadioButton v-model="mode" value="selected" accent="brand">
            {{ t('firewall:global:scope:selected') }}
          </UiRadioButton>
        </UiRadioButtonGroup>

        <div v-if="mode === 'selected'" class="pools" role="group" :aria-label="t('firewall:global:scope:selected')">
          <div v-for="pool of pools" :key="pool.id" class="pool">
            <UiCheckbox
              accent="brand"
              :model-value="selected.has(pool.id)"
              @update:model-value="checked => togglePool(pool.id, checked === true)"
            >
              {{ pool.name }}
            </UiCheckbox>
            <UiInfo v-if="entering.includes(pool)" accent="info" wrap>{{ receives(pool.id) }}</UiInfo>
          </div>
          <UiAlert v-if="selected.size === 0" accent="warning">{{ t('firewall:global:scope:empty') }}</UiAlert>
        </div>
        <!-- vdf#47: what the pools entering the scope will receive, before it's written -->
        <div v-else-if="entering.length > 0" class="pools">
          <div v-for="pool of entering" :key="pool.id" class="pool">
            <span class="typo-body-bold-small">{{ pool.name }}</span>
            <UiInfo accent="info" wrap>{{ receives(pool.id) }}</UiInfo>
          </div>
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
import { useVdfGlobalReach } from '@/modules/vdf/composables/vdf-global-reach.composable.ts'
import type { VdfDocument, VdfGlobalPool, VdfGlobalScope } from '@/modules/vdf/types.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Where the global configuration applies: every pool (also those connected
// later), or a selection. Part of the draft, published with the rest.
const { pools, scope, document } = defineProps<{
  pools: VdfGlobalPool[]
  // the scope as currently drafted
  scope: VdfGlobalScope
  // the global configuration as currently drafted
  document: VdfDocument
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

// pools the chosen scope brings in: they don't hold the global
// configuration yet (a pool another XO owns never gets it)
const entering = computed(() =>
  pools.filter(
    pool =>
      !pool.inScope &&
      pool.state !== 'other-xo' &&
      pool.seenAt === undefined &&
      (mode.value === 'all' || selected.value.has(pool.id))
  )
)

const { receivesText } = useVdfGlobalReach(
  () => document,
  () => entering.value
)

const receives = (poolId: string) =>
  document.policies.length === 0
    ? t('firewall:global:scope:receives:none')
    : t('firewall:global:scope:receives', { policies: receivesText(poolId) })

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

  /* under "Selected pools" */
  .pools {
    gap: 0.8rem;
    padding-inline-start: 2.4rem;
  }

  .pool {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    /* the box apart from its label */
    :deep(.checkbox-label) {
      gap: 0.8rem;
    }
  }

  .hint {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
