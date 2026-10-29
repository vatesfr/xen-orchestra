<template>
  <UiCard class="vdf-services-card">
    <UiTitle>
      {{ t('firewall:services') }}
      <template #action>
        <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="editService()">
          {{ t('firewall:services:new') }}
        </UiButton>
      </template>
    </UiTitle>
    <UiInfo accent="info" wrap>{{ t('firewall:services:info') }}</UiInfo>

    <VtsStateHero v-if="rows.length === 0" format="card" type="no-data" size="extra-small" horizontal>
      {{ t('firewall:services:empty') }}
    </VtsStateHero>
    <div v-for="row of rows" :key="row.service.name" class="service">
      <div class="header">
        <span class="typo-body-bold">{{ row.service.name }}</span>
        <UiTag accent="muted" variant="secondary">{{ t(`firewall:service:kind:${row.service.kind}`) }}</UiTag>
        <UiTag v-if="row.monitored" v-tooltip="t('firewall:services:monitor:tooltip')" accent="info" variant="primary">
          <VtsIcon name="fa:eye" size="small" />
          {{ t('firewall:mode:monitor') }}
        </UiTag>
        <UiTag v-if="row.draftState" :accent="row.draftState === 'new' ? 'success' : 'info'" variant="secondary">
          {{ t(`firewall:draft-state:${row.draftState}`) }}
        </UiTag>
        <span class="actions">
          <UiButtonIcon
            v-tooltip="t('action:edit')"
            icon="action:edit"
            accent="brand"
            size="small"
            :aria-label="t('action:edit')"
            @click="editService(row.service.name)"
          />
          <UiButtonIcon
            v-tooltip="t('firewall:services:delete')"
            icon="action:delete"
            accent="danger"
            size="small"
            :aria-label="t('firewall:services:delete')"
            @click="deleteService(row.service.name)"
          />
        </span>
      </div>
      <span class="secondary typo-body-regular-small">
        {{
          row.service.macs?.length
            ? t('firewall:services:members:macs', {
                group: displayName(row.service.group),
                macs: row.service.macs.join(', '),
              })
            : t('firewall:services:members', { group: displayName(row.service.group) })
        }}
      </span>
      <UiInfo v-for="error of row.errors" :key="error.type" accent="danger" wrap>
        {{ t(`firewall:service-form:error:${error.type}`, { ...error }) }}
      </UiInfo>
    </div>

    <VdfServicesStatus :pool-id declarable @declare="declare" />
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfServicesStatus from '@/modules/vdf/components/services/VdfServicesStatus.vue'
import { useVdfEditors } from '@/modules/vdf/composables/vdf-editors.composable.ts'
import { useVdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import type { VdfServiceKind } from '@/modules/vdf/types.ts'
import { displayName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { documentServiceErrors, isServiceMonitored } from '@/modules/vdf/utils/vdf-services.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { isEqual } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// A pool's declared infrastructure services (vdf#103), in its draft like
// groups and policies, and what its hosts' agents say of them
const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const scope = useVdfScope(() => ({ kind: 'pool' as const, pool }))

const { document, publishedDocument, deleteService } = scope

const { editService } = useVdfEditors(() => ({ kind: 'pool' as const, pool }))

const poolId = computed(() => pool.id)

const rows = computed(() => {
  const errors = documentServiceErrors(document.value)

  return (document.value.services ?? []).map((service, index) => {
    const published = publishedDocument.value.services?.find(other => other.name === service.name)

    return {
      service,
      monitored: isServiceMonitored(service),
      draftState: published === undefined ? 'new' : isEqual(published, service) ? undefined : 'modified',
      errors: errors[index].errors,
    }
  })
})

// a source the hosts saw: declared with its kind, and its address to
// start its group from
function declare(kind: VdfServiceKind, src: string) {
  void editService(undefined, { kind, name: `${kind}-${src.replace(/[^0-9a-z]+/gi, '-')}`, address: src })
}
</script>

<style lang="postcss" scoped>
.vdf-services-card {
  .service {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .actions {
    display: flex;
    gap: 0.4rem;
    margin-inline-start: auto;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
