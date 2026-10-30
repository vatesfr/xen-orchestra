<template>
  <VtsStateHero v-if="isBusy || destinationPoolName === undefined" format="page" type="busy" size="medium" />
  <VtsSuccessStateHero v-else-if="launched !== undefined">
    <template #title>{{ t('v2v:n-vms-launched', { n: launched.count }) }}</template>
    {{ t('v2v:launch-success') }}
    <template #actions>
      <UiLink :to="launched.taskRoute" size="medium">{{ t('action:see-task') }}</UiLink>
      <UiButton variant="secondary" accent="brand" size="medium" @click="backToVms()">
        {{ t('action:back-to-vms') }}
      </UiButton>
    </template>
  </VtsSuccessStateHero>
  <div v-else class="v2v-review-step">
    <UiCardTitle>
      {{ t('review-and-launch') }}
      <template #description>
        <InlineParts>
          <span v-for="part of summaryParts" :key="part">{{ part }}</span>
        </InlineParts>
      </template>
    </UiCardTitle>
    <V2vLaunchOptionsCard :stop-source-checkbox-bindings :stop-on-error-checkbox-bindings :concurrency-input-bindings />
    <V2vVmLaunchOptionsTable
      v-if="vmLaunchOptionsRows.length > 0"
      :rows="vmLaunchOptionsRows"
      :default-stop-source="formData.stopSource"
      @change-stop-source="(id, value) => changeStopSource(id, value)"
    />
    <V2vLaunchGroup :heading="groupHeadings.excluded" :count="excludedVms.length">
      <V2vLaunchGroupVm v-for="vm of excludedVms" :key="vm.id">
        <template #name>
          <UiLink size="small" :to="vm.route">{{ vm.name }}</UiLink>
        </template>
        <span>{{ vm.reason }}</span>
      </V2vLaunchGroupVm>
    </V2vLaunchGroup>
    <V2vLaunchGroup :heading="groupHeadings.migrated" :count="migratedVms.length">
      <V2vMigratedVmItem
        v-for="vm of migratedVms"
        :key="vm.id"
        :vm
        :destination-pool-name
        @confirm="isConfirmed => confirmSecondCopy(vm.id, isConfirmed)"
      />
    </V2vLaunchGroup>
    <V2vLaunchGroup :heading="groupHeadings.resumed" :count="resumedVms.length">
      <V2vLaunchGroupVm v-for="vm of resumedVms" :key="vm.id">
        <template #name>{{ vm.name }}</template>
        <InlineParts>
          <span v-for="part of vm.parts" :key="part">{{ part }}</span>
        </InlineParts>
      </V2vLaunchGroupVm>
    </V2vLaunchGroup>
    <V2vLaunchGroup :heading="groupHeadings.new" :count="newVmsCount">
      <span class="typo-body-regular-small">{{ newVmsSummary }}</span>
    </V2vLaunchGroup>
    <UiAlert v-if="launchError !== undefined" accent="danger">
      {{ launchError.title }}
      <template #description>
        <p v-for="message of launchError.messages" :key="message">{{ message }}</p>
      </template>
    </UiAlert>
    <V2vWizardStepActions @back="back()">
      <UiButton
        accent="brand"
        variant="primary"
        size="medium"
        :disabled="!canLaunch"
        :busy="isLaunching"
        @click="launch()"
      >
        {{ t('action:launch-n-vms', { n: launchCount }) }}
      </UiButton>
    </V2vWizardStepActions>
  </div>
</template>

<script lang="ts" setup>
import V2vLaunchGroup from '@/modules/v2v/components/review/V2vLaunchGroup.vue'
import V2vLaunchGroupVm from '@/modules/v2v/components/review/V2vLaunchGroupVm.vue'
import V2vLaunchOptionsCard from '@/modules/v2v/components/review/V2vLaunchOptionsCard.vue'
import V2vMigratedVmItem from '@/modules/v2v/components/review/V2vMigratedVmItem.vue'
import V2vVmLaunchOptionsTable from '@/modules/v2v/components/review/V2vVmLaunchOptionsTable.vue'
import V2vWizardStepActions from '@/modules/v2v/components/wizard/V2vWizardStepActions.vue'
import { useV2vReviewStep } from '@/modules/v2v/composables/use-v2v-review-step.composable.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsSuccessStateHero from '@core/components/success-state-hero/VtsSuccessStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const {
  isBusy,
  summaryParts,
  destinationPoolName,
  form: { formData, stopSourceCheckboxBindings, stopOnErrorCheckboxBindings, concurrencyInputBindings },
  vmLaunchOptionsRows,
  groupHeadings,
  excludedVms,
  migratedVms,
  resumedVms,
  newVmsCount,
  newVmsSummary,
  launchCount,
  canLaunch,
  isLaunching,
  launchError,
  launched,
  confirmSecondCopy,
  changeStopSource,
  launch,
  back,
  backToVms,
} = useV2vReviewStep()
</script>

<style lang="postcss" scoped>
.v2v-review-step {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
