import { isPropParam, ModelParam, PropParam } from '@core/packages/story/story-param.ts'
import { Widget } from '@core/packages/story/story-widget.ts'
import type { PropConfig } from '@core/packages/story/types.ts'

export function configureProp(param: PropParam | ModelParam, config: PropConfig) {
  const { widget, type, required, help, default: paramDefault, preset: paramRef } = config

  if (type) {
    param.type(type)
  } else {
    param.type(paramRef.value !== undefined ? typeof paramRef.value : typeof paramDefault)
  }

  if (required) {
    param.required()
  }

  if (help) {
    param.help(help)
  }

  function apply(propParam: PropParam) {
    propParam.default(paramDefault)
    propParam.setRef(config.preset)

    if (widget instanceof Widget) {
      propParam.widget(widget)
    } else if (widget !== false) {
      propParam.widget()
    }
  }

  if (isPropParam(param)) {
    apply(param)
  } else {
    param.prop(p => {
      apply(p)
    })
  }
}
