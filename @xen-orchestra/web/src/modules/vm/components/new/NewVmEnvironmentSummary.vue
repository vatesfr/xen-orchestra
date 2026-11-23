<template>
  <NewVmSection :title="t('new-vm:environment-setup')">
    <VtsColumns>
      <VtsColumn>
        <VtsTabularKeyValueList>
          <NewVmReviewRow :label="t('pool')">
            <template v-if="vmState.pool" #default>
              <UiLink size="medium" icon="object:pool" :to="poolRoute">
                {{ vmState.pool.name_label }}
              </UiLink>
            </template>
          </NewVmReviewRow>
        </VtsTabularKeyValueList>
      </VtsColumn>
      <VtsColumn>
        <VtsTabularKeyValueList>
          <NewVmReviewRow :label="t('template')" :value="vmState.new_vm_template?.name_label" />
        </VtsTabularKeyValueList>
      </VtsColumn>
    </VtsColumns>
  </NewVmSection>
</template>

<script lang="ts" setup>
import NewVmSection from '@/modules/vm/components/new/NewVmSection.vue'
import NewVmReviewRow from '@/modules/vm/components/new/review/NewVmReviewRow.vue'
import { useNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { vmState } = useNewVmForm()

const poolRoute = computed(() =>
  vmState.pool === undefined ? undefined : { name: '/pool/[id]/dashboard', params: { id: vmState.pool.id } }
)
</script>
