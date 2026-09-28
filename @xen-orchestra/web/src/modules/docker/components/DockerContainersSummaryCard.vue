<template>
  <UiCard class="docker-containers-summary-card">
    <UiTitle>{{ t('containers') }}</UiTitle>
    <VtsStateHero v-if="hasError" format="card" type="error" size="small">
      {{ t('docker-unreachable') }}
    </VtsStateHero>
    <template v-else>
      <div class="numbers">
        <UiCardNumbers class="total" :label="t('total')" :value="summary.total" size="medium" />
        <UiCardNumbers class="running" :label="t('status:running')" :value="summary.running" size="medium" />
        <UiCardNumbers class="paused" :label="t('status:paused')" :value="summary.paused" size="medium" />
        <UiCardNumbers class="stopped" :label="t('status:stopped')" :value="summary.stopped" size="medium" />
      </div>
      <div v-if="summary.composeProjects.length > 0" class="compose">
        <span class="typo-caption-small label">
          {{ t('compose-projects-detected', { n: summary.composeProjects.length }) }}
        </span>
        <div class="projects">
          <UiTag
            v-for="project of summary.composeProjects"
            :key="project.name"
            :accent="project.running === project.containers ? 'success' : 'warning'"
            variant="secondary"
          >
            {{ `${project.name} ${project.running}/${project.containers}` }}
          </UiTag>
        </div>
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { DockerContainersSummary } from '@/modules/docker/utils/xo-docker.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  summary: DockerContainersSummary
  hasError?: boolean
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.docker-containers-summary-card {
  .numbers {
    display: flex;
    flex-wrap: wrap;
    gap: 3.2rem;
  }

  /* TODO(design-system): UiCardNumbers has no accent prop to color its value, hence the override */
  .running :deep(.values) {
    color: var(--color-success-txt-base);
  }

  .stopped :deep(.values) {
    color: var(--color-danger-txt-base);
  }

  .compose {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;

    .label {
      color: var(--color-neutral-txt-secondary);
    }

    .projects {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
    }
  }
}
</style>
