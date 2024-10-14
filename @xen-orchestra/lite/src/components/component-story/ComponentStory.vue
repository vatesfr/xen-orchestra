<template>
  <TabList>
    <TabItem v-bind="tab(TAB.PROPS, propParams)">Props</TabItem>
    <TabItem class="event-tab" v-bind="tab(TAB.EVENTS, eventParams)">
      Events
      <UiCounter
        v-if="unreadEventsCount > 0"
        :value="unreadEventsCount"
        accent="success"
        variant="primary"
        size="small"
      />
    </TabItem>
    <TabItem v-bind="tab(TAB.SLOTS, slotParams)">Slots</TabItem>
    <TabItem v-bind="tab(TAB.SETTINGS, settingParams)">Settings</TabItem>
    <MenuList placement="bottom" border>
      <template #trigger="{ open, isOpen }">
        <TabItem :active="isOpen" :disabled="presets === undefined" class="preset-tab" @click="open">
          <UiIcon :icon="faSliders" />
          Presets
        </TabItem>
      </template>
      <MenuItem v-for="(preset, label) in presets" :key="label" @click="applyPreset(preset)">
        {{ label }}
      </MenuItem>
    </MenuList>
  </TabList>

  <div :class="{ 'full-width': fullWidthComponent }" class="tabs">
    <UiCard v-if="selectedTab === TAB.NONE" class="tab-content">
      <i>No configuration defined</i>
    </UiCard>
    <UiCard v-else-if="selectedTab === TAB.PROPS" class="tab-content">
      <StoryPropParams v-model="propValues" :params="propParams" @reset="resetProps" />
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
              size="medium"
              accent="info"
              variant="tertiary"
              @click="eventsLog = []"
            >
              Clear
            </UiButton>
          </template>
        </UiCardTitle>
        <div class="events-log">
          <CodeHighlight v-for="event in eventLogRows" :key="event.id" :code="event.args" class="event-log" />
        </div>
      </UiCard>
    </div>
    <UiCard v-else-if="selectedTab === TAB.SLOTS" class="tab-content">
      <StorySlotParams :params="slotParams" />
    </UiCard>
    <UiCard v-else-if="selectedTab === TAB.SETTINGS" class="tab-content">
      <StorySettingParams v-model="settingValues" :params="settingParams" @reset="resetSettings" />
    </UiCard>
    <UiCard class="tab-content story-result">
      <slot :properties="slotProperties" :settings="slotSettings" />
    </UiCard>
  </div>
  <UiCard v-if="documentation !== undefined" class="documentation">
    <AppMarkdown :content="documentation" />
  </UiCard>
</template>

<script lang="ts" setup>
import AppMarkdown from '@/components/AppMarkdown.vue'
import CodeHighlight from '@/components/CodeHighlight.vue'
import StoryEventParams from '@/components/component-story/StoryEventParams.vue'
import StoryPropParams from '@/components/component-story/StoryPropParams.vue'
import StorySettingParams from '@/components/component-story/StorySettingParams.vue'
import StorySlotParams from '@/components/component-story/StorySlotParams.vue'
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import {
  isEventParam,
  isModelParam,
  isPropParam,
  isSettingParam,
  isSlotParam,
  ModelParam,
  type Param,
} from '@/libs/story/story-param'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { faSliders } from '@fortawesome/free-solid-svg-icons'
import 'highlight.js/styles/github-dark.css'
import { uniqueId, upperFirst } from 'lodash-es'
import { computed, onBeforeMount, reactive, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  params: (Param | ModelParam)[]
  presets?: Record<
    string,
    {
      props?: Record<string, any>
      settings?: Record<string, any>
    }
  >
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

const propValues = ref<Record<string, any>>({})
const settingValues = ref<Record<string, any>>({})
const eventsLog = ref<{ id: string; name: string; args: { name: string; value: any }[] }[]>([])
const unreadEventsCount = ref(0)

const resetProps = () => {
  propParams.value.forEach(param => {
    propValues.value[param.name] = param.getPresetValue()
  })
}

const resetSettings = () => {
  settingParams.value.forEach(param => {
    settingValues.value[param.name] = param.getPresetValue()
  })
}

watchEffect(() => {
  resetProps()
  resetSettings()
})

watch(selectedTab, tab => {
  if (tab === TAB.EVENTS) {
    unreadEventsCount.value = 0
  }
})

const logEvent = (name: string, args: { name: string; value: any }[]) => {
  if (selectedTab.value !== TAB.EVENTS) {
    unreadEventsCount.value += 1
  }

  eventsLog.value.unshift({
    id: uniqueId('event-log'),
    name,
    args,
  })
}

const eventLogRows = computed(() => {
  return eventsLog.value.map(eventLog => {
    const args = eventLog.args.map(arg => `${arg.name}: ${JSON.stringify(arg.value)}`).join(', ')

    return {
      id: eventLog.id,
      name: eventLog.name,
      args: `${eventLog.name}(${args})`,
    }
  })
})

const slotProperties = computed(() => {
  const properties: Record<string, any> = {}

  propParams.value.forEach(({ name }) => {
    properties[name] = propValues.value[name]
  })

  eventParams.value.forEach(eventParam => {
    properties[`on${upperFirst(eventParam.name)}`] = (...args: any[]) => {
      if (eventParam.isVModel()) {
        propValues.value[eventParam.rawName] = args[0]
      }
      const logArgs = Object.keys(eventParam.getArguments()).map((argName, index) => ({
        name: argName,
        value: args[index],
      }))
      eventParam.getPresetValue()?.(...args)
      logEvent(eventParam.name, logArgs)
    }
  })

  return properties
})

const slotSettings = computed(() => {
  const result: Record<string, any> = {}

  settingParams.value.forEach(({ name }) => {
    result[name] = settingValues.value[name]
  })

  return result
})

const documentation = ref()

const route = useRoute()

route.meta.storyMdLoader?.().then(md => {
  documentation.value = md
})

const applyPreset = (preset: { props?: Record<string, any>; settings?: Record<string, any> }) => {
  if (preset.props !== undefined) {
    Object.entries(preset.props).forEach(([name, value]) => {
      propValues.value[name] = value
    })
  }

  if (preset.settings !== undefined) {
    Object.entries(preset.settings).forEach(([name, value]) => {
      settingValues.value[name] = value
    })
  }
}
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
