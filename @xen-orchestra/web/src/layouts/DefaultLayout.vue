<template>
  <CoreLayout>
    <template #app-logo>
      <LogoTextOnly :short="uiStore.isMobile" class="logo" />
    </template>
    <template #app-header>
      <UiButton :right-icon="faArrowUpRightFromSquare" level="tertiary">XO 5</UiButton>
      <ButtonIcon
        v-tooltip="{ content: $t('tasks.quick-view'), placement: 'bottom-end' }"
        :icon="faBarsProgress"
        size="large"
      />
      <UserLogo v-tooltip="{ content: $t('account-organization-more'), placement: 'bottom-end' }" size="medium" />
    </template>
    <template #sidebar-content>
      <InfraPoolList />
    </template>
    <template #content-header>
      <slot name="content-header" />
    </template>
    <template #content>
      <slot name="content" />
    </template>
    <template v-if="$slots['panel-header']" #panel-header>
      <slot name="panel-header" />
    </template>
    <template v-if="$slots['panel-content']" #panel-content>
      <slot name="panel-content" />
    </template>
  </CoreLayout>
</template>

<script lang="ts" setup>
import InfraPoolList from '@/components/infra/InfraPoolList.vue'
import LogoTextOnly from '@/components/LogoTextOnly.vue'
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import UiButton from '@core/components/button/UiButton.vue'
import UserLogo from '@core/components/user/UserLogo.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import CoreLayout from '@core/layouts/CoreLayout.vue'
import { useUiStore } from '@core/stores/ui.store'
import { faArrowUpRightFromSquare, faBarsProgress } from '@fortawesome/free-solid-svg-icons'

defineSlots<{
  content(): any
  'panel-header'(): any
  'panel-content'(): any
  'content-header'(): any
}>()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.logo {
  height: 1.6rem;
}
</style>
