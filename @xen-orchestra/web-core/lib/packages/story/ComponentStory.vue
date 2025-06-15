<template>
  <TabList>
    <TabItem v-bind="tab(TAB.PROPS, propParams)">Props</TabItem>
    <TabItem class="event-tab" v-bind="tab(TAB.EVENTS, eventParams)">
      Events
      <UiCounter
        v-if="unreadEventsCount > 0"
        :value="unreadEventsCount"
        accent="success"
        size="small"
        variant="primary"
      />
    </TabItem>
    <TabItem v-bind="tab(TAB.SLOTS, slotParams)">Slots</TabItem>
    <TabItem v-bind="tab(TAB.SETTINGS, settingParams)">Settings</TabItem>
    <MenuList placement="bottom">
      <template #trigger="{ open, isOpen }">
        <TabItem :active="isOpen" :disabled="presets === undefined" class="preset-tab" @click="open">
          <VtsIcon :icon="faSliders" accent="brand" />
          Presets
        </TabItem>
      </template>
      <MenuItem
        v-for="(preset, label) in presets"
        :key="label"
        @click="
          () => {
            resetProps()
            resetSettings()
            preset()
          }
        "
      >
        {{ label }}
      </MenuItem>
    </MenuList>
  </TabList>

  <div :class="{ 'full-width': fullWidthComponent }" class="tabs">
    <UiCard v-if="selectedTab === TAB.NONE" class="tab-content">
      <i>No configuration defined</i>
    </UiCard>
    <UiCard v-else-if="selectedTab === TAB.PROPS" class="tab-content">
      <StoryPropParams :params="propParams" @reset="resetProps" />
    </UiCard>
    <div v-else-if="selectedTab === TAB.EVENTS" class="tab-content event-tab-content">
      <UiCard>
        <StoryEventParams :params="eventParams" />
      </UiCard>
      <UiCard>
        <UiCardTitle>
          Logs
          <template #right>
            <UiButton
              v-if="eventsLog.length > 0"
              accent="brand"
              size="medium"
              variant="tertiary"
              @click="eventsLog = []"
            >
              Clear
            </UiButton>
          </template>
        </UiCardTitle>
        <div class="events-log">
          <VtsCodeHighlight v-for="(event, index) in eventLogRows" :key="index" :code="event.args" class="event-log" />
        </div>
      </UiCard>
    </div>
    <UiCard v-else-if="selectedTab === TAB.SLOTS" class="tab-content">
      <StorySlotParams :params="slotParams" />
    </UiCard>
    <UiCard v-else-if="selectedTab === TAB.SETTINGS" class="tab-content">
      <StorySettingParams :params="settingParams" @reset="resetSettings" />
    </UiCard>
    <UiCard class="tab-content story-result">
      <slot />
    </UiCard>
  </div>
  <UiCard v-if="documentation !== undefined" class="documentation">
    <VtsMarkdown :content="documentation" />
  </UiCard>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import VtsCodeHighlight from '@core/packages/markdown/VtsCodeHighlight.vue'
import VtsMarkdown from '@core/packages/markdown/VtsMarkdown.vue'
import { faSliders } from '@fortawesome/free-solid-svg-icons'
import 'highlight.js/styles/github-dark.css'
import { computed, inject, onBeforeMount, reactive, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { isEventParam, isModelParam, isPropParam, isSettingParam, isSlotParam, type Param } from './story-param.ts'
import StoryEventParams from './StoryEventParams.vue'
import StoryPropParams from './StoryPropParams.vue'
import StorySettingParams from './StorySettingParams.vue'
import StorySlotParams from './StorySlotParams.vue'
import { IK_STORY_EVENT_LOGS } from './types.ts'

const props = defineProps<{
  params: Param[]
  presets?: Record<string, () => void>
  fullWidthComponent?: boolean
}>()

enum TAB {
  NONE,
  PROPS,
  EVENTS,
  SLOTS,
  SETTINGS,
}

const selectedTab = ref<TAB>(TAB.NONE)

const tab = (tab: TAB, params: Param[]) =>
  reactive({
    onClick: () => (selectedTab.value = tab),
    active: computed(() => selectedTab.value === tab),
    disabled: computed(() => params.length === 0),
  })

const modelParams = computed(() => props.params.filter(isModelParam))

const propParams = computed(() => [
  ...props.params.filter(isPropParam),
  ...modelParams.value.map(modelParam => modelParam.getPropParam()),
])

const eventParams = computed(() => [
  ...props.params.filter(isEventParam),
  ...modelParams.value.map(modelParam => modelParam.getEventParam()),
])

const settingParams = computed(() => props.params.filter(isSettingParam))
const slotParams = computed(() => props.params.filter(isSlotParam))

onBeforeMount(() => {
  if (propParams.value.length !== 0) {
    selectedTab.value = TAB.PROPS
  } else if (eventParams.value.length !== 0) {
    selectedTab.value = TAB.EVENTS
  } else if (slotParams.value.length !== 0) {
    selectedTab.value = TAB.SLOTS
  } else if (settingParams.value.length !== 0) {
    selectedTab.value = TAB.SETTINGS
  }
})

const unreadEventsCount = ref(0)

const resetProps = () => propParams.value.forEach(param => param.reset())

const resetSettings = () => settingParams.value.forEach(param => param.reset())

watchEffect(() => {
  resetProps()
  resetSettings()
})

watch(selectedTab, tab => {
  if (tab === TAB.EVENTS) {
    unreadEventsCount.value = 0
  }
})

const eventsLog = inject(IK_STORY_EVENT_LOGS, ref([]))

watch(
  () => eventsLog.value.length,
  (newLength, oldLength) => {
    if (newLength > oldLength && selectedTab.value !== TAB.EVENTS) {
      unreadEventsCount.value += newLength - oldLength
    }
  }
)

const eventLogRows = computed(() => {
  return eventsLog.value.map(eventLog => {
    const args = eventLog.args.map(arg => `${arg.name}: ${JSON.stringify(arg.value)}`).join(', ')

    return {
      name: eventLog.name,
      args: `${eventLog.name}(${args})`,
    }
  })
})

const documentation = ref()

const route = useRoute()

route.meta.storyMdLoader?.().then(md => {
  documentation.value = md
})
</script>

<style lang="postcss" scoped>
.event-tab {
  gap: 0.5rem;
}

.preset-tab {
  margin-left: auto;
}

.event-tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.events-log {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.event-log {
  opacity: 0.5;

  &:first-child {
    opacity: 1;
  }
}

.tabs {
  display: flex;
  padding: 1rem;
  gap: 1rem;

  &.full-width {
    flex-direction: column;
  }

  .tab-content {
    flex: 1;
    height: auto;
  }
}

.documentation {
  margin: 1rem;

  .ui-title {
    margin-bottom: 1rem;
  }
}
</style>
