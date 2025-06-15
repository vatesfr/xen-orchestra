import { configureProp } from '@core/packages/story/configure-prop.ts'
import { event, model, prop, setting, slot } from '@core/packages/story/story-param.ts'
import { text } from '@core/packages/story/story-widget.ts'
import {
  type EventConfig,
  IK_STORY_EVENT_LOGS,
  type PropConfig,
  type SettingConfig,
  type SlotConfig,
  type StoryEventLogs,
} from '@core/packages/story/types.ts'
import { startCase, upperFirst } from 'lodash-es'
import { provide, type Reactive, reactive, ref, toRef } from 'vue'

export function useStory<
  TProps extends Record<string, PropConfig>,
  TModels extends Record<string, PropConfig>,
  TSettings extends Record<string, SettingConfig>,
>(config: {
  props?: TProps
  models?: TModels
  events?: Record<string, EventConfig>
  slots?: Record<string, SlotConfig>
  settings?: TSettings
}) {
  Object.values(config.props ?? {}).forEach(config => (config.preset = toRef(config.preset)))
  Object.values(config.models ?? {}).forEach(config => (config.preset = toRef(config.preset)))
  Object.values(config.settings ?? {}).forEach(config => (config.preset = toRef(config.preset)))

  const eventsLog = ref([] as StoryEventLogs)

  provide(IK_STORY_EVENT_LOGS, eventsLog)

  const settings = reactive(
    Object.fromEntries(
      Object.entries(config.settings ?? {}).map(([name, settingConfig]) => {
        return [name, toRef(settingConfig.preset)]
      })
    )
  ) as Reactive<{
    [K in keyof TSettings]: TSettings[K]['preset']
  }>

  const params = [
    ...Object.entries(config.props || {}).map(([name, propConfig]) => {
      const param = prop(name)

      configureProp(param, propConfig)

      return param
    }),
    ...Object.entries(config.models || {}).map(([name, modelConfig]) => {
      const param = model(name)

      configureProp(param, modelConfig)

      return param
    }),
    ...Object.entries(config.events || {}).map(([name, eventConfig]) => {
      const param = event(name)

      if (eventConfig.args) {
        param.args(eventConfig.args)
      }

      if (eventConfig.help) {
        param.help(eventConfig.help)
      }

      return param
    }),
    ...Object.entries(config.slots || {}).map(([name, slotConfig]) => {
      const param = slot(name)

      if (slotConfig.help) {
        param.help(slotConfig.help)
      }

      if (slotConfig.props) {
        Object.entries(slotConfig.props).forEach(([propName, propType]) => {
          param.prop(propName, propType)
        })
      }

      return param
    }),
    ...Object.entries(config.settings || {}).map(([name, settingConfig]) => {
      const param = setting(startCase(name))

      if (settingConfig.widget) {
        param.widget(settingConfig.widget)
      } else {
        param.widget(text())
      }

      if (settingConfig.help) {
        param.help(settingConfig.help)
      }

      param.setRef(settingConfig.preset)

      return param
    }),
  ]

  return {
    eventsLog,
    settings,
    bindings: reactive(
      Object.fromEntries([
        ...Object.entries(config.props ?? {}).map(([name, propConfig]) => {
          return [name, propConfig.preset]
        }),
        ...Object.entries(config.models ?? {}).map(([name, modelConfig]) => {
          return [name, modelConfig.preset]
        }),
        ...Object.entries(config.models ?? {}).map(([name, modelConfig]) => {
          return [
            `onUpdate:${name}`,
            (value: any) => {
              modelConfig.preset.value = value
              eventsLog.value.unshift({
                name: `update:${name}`,
                args: [
                  {
                    name,
                    value,
                  },
                ],
              })
            },
          ]
        }),
        ...Object.entries(config.events ?? {}).map(([name, eventConfig]) => {
          return [
            `on${upperFirst(name)}`,
            (...args: any[]) => {
              eventConfig.handler?.(...args)
              eventsLog.value.unshift({
                name,
                args: Object.keys(eventConfig.args ?? {}).map((argName, index) => ({
                  name: argName,
                  value: args[index],
                })),
              })
            },
          ]
        }),
      ])
    ) as Reactive<
      {
        [K in keyof TProps]: TProps[K]['preset']
      } & {
        [K in keyof TModels]: TModels[K]['preset']
      }
    >,
    params,
  }
}
