<template>
  <div class="pool-updates-start">
    <UiCard>
      <UiCardTitle>
        {{ t('missing-patches') }}
        <template v-if="poolMissingPatches.length > 0" #info>
          {{ t('n-missing', poolMissingPatches.length) }}
        </template>
      </UiCardTitle>
      <VtsStateHero v-if="!arePoolMissingPatchesReady" format="card" type="busy" size="medium" />
      <VtsStateHero v-else-if="hasPoolMissingPatchesError" format="card" type="error" size="small">
        {{ t('error-no-data') }}
      </VtsStateHero>
      <div v-else class="table-wrapper">
        <HostPatchesTable :patches="poolMissingPatches" />
      </div>
    </UiCard>

    <UiCard>
      <UiCardTitle>{{ t('rolling-update:before-you-start') }}</UiCardTitle>
      <VtsStateHero v-if="!isPrecheckReady" format="card" type="busy" size="medium" />
      <VtsStateHero v-else-if="hasPrecheckError" format="card" type="error" size="small">
        {{ t('error-no-data') }}
      </VtsStateHero>
      <ul v-else class="checks">
        <li v-for="check in checks" :key="check.id" class="check">
          <UiInfo :accent="CHECK_ACCENTS[check.result]" wrap>
            {{ t(`rolling-update:check:${kebabCase(check.id)}`) }}
          </UiInfo>
          <ul v-if="check.objects.length > 0" class="objects typo-body-regular-small">
            <li v-for="object in check.objects" :key="`${object.type}/${object.id}`">
              <UiLink v-if="getObjectRoute(object) !== undefined" :to="getObjectRoute(object)" size="small">
                {{ getObjectName(object) }}
              </UiLink>
              <template v-else>{{ getObjectName(object) }}</template>
              <template v-if="object.reason !== undefined">{{ `: ${object.reason}` }}</template>
            </li>
          </ul>
        </li>
      </ul>
      <VtsButtonGroup>
        <UiButton
          variant="primary"
          accent="brand"
          size="medium"
          :busy="isStarting"
          :disabled="!canStart"
          @click="emit('start', checks)"
        >
          {{ t('action:start-rolling-update') }}
        </UiButton>
      </VtsButtonGroup>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import HostPatchesTable from '@/modules/host/components/HostPatchesTable.vue'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoPoolMissingPatchesCollection } from '@/modules/pool/remote-resources/use-xo-pool-missing-patches-collection.ts'
import { useXoPoolRollingUpdatePrecheck } from '@/modules/pool/remote-resources/use-xo-pool-rolling-update-precheck.ts'
import { getOfferedStartOptions, isRollingUpdateStartBlocked } from '@/modules/pool/utils/rolling-update.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsButtonGroup from '@core/components/button-group/VtsButtonGroup.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { PoolRollingUpdatePrecheck } from '@vates/types'
import { kebabCase } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

type PrecheckObject = PoolRollingUpdatePrecheck['objects'][number]

const { pool, isStarting } = defineProps<{
  pool: FrontXoPool
  isStarting: boolean
}>()

const emit = defineEmits<{
  start: [checks: PoolRollingUpdatePrecheck[]]
}>()

const CHECK_ACCENTS: Record<PoolRollingUpdatePrecheck['result'], InfoAccent> = {
  passed: 'success',
  info: 'info',
  blocking: 'danger',
}

const { t } = useI18n()

const { poolMissingPatches, arePoolMissingPatchesReady, hasPoolMissingPatchesError } =
  useXoPoolMissingPatchesCollection({}, () => pool.id)

const { checks, isPrecheckReady, hasPrecheckError } = useXoPoolRollingUpdatePrecheck({}, () => pool.id)

const { getHostById } = useXoHostCollection()

const { getVmById } = useXoVmCollection()

// A blocking check stops the start, unless an option of the start dialog lifts it
const canStart = computed(() => {
  if (!isPrecheckReady.value || hasPrecheckError.value || poolMissingPatches.value.length === 0) {
    return false
  }

  const allOptions = Object.fromEntries(getOfferedStartOptions(checks.value).map(option => [option, true]))

  return !isRollingUpdateStartBlocked(checks.value, allOptions)
})

function getObjectName(object: PrecheckObject) {
  switch (object.type) {
    case 'host':
      return getHostById(object.id as never)?.name_label ?? object.id
    case 'VM':
      return getVmById(object.id as never)?.name_label ?? object.id
    case 'pool':
      return pool.name_label
    default:
      return object.id
  }
}

function getObjectRoute(object: PrecheckObject): RouteLocationRaw | undefined {
  switch (object.type) {
    case 'host':
      return { name: '/host/[id]/dashboard', params: { id: object.id } }
    case 'VM':
      return { name: '/vm/[id]/dashboard', params: { id: object.id } }
    default:
      return undefined
  }
}
</script>

<style lang="postcss" scoped>
.pool-updates-start {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .table-wrapper {
    overflow-y: auto;
    margin-inline: -2.4rem;
    border-block: 0.1rem solid var(--color-neutral-border);
  }

  .checks,
  .check {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .objects {
    padding-inline-start: 2.4rem;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
