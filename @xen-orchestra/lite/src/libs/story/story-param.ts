import mixin, { type MixinAbstractConstructor } from '@/libs/mixin'
import type { Widget } from '@/libs/story/story-widget'
import { boolean, choice, number, object, text } from '@/libs/story/story-widget'
import { icons } from '@core/icons'

function WithType(Base: MixinAbstractConstructor<BaseParam>) {
  abstract class WithType extends Base /* implements HasType */ {
    _type: string | undefined

    type(type: string) {
      this._type = type

      return this
    }

    abstract getTypeLabel(): string

    getType() {
      return this._type
    }
  }

  return WithType
}

function WithWidget(Base: MixinAbstractConstructor<BaseParam>) {
  abstract class WithWidget extends Base /* implements HasWidget */ {
    _widget: Widget | undefined

    abstract guessWidget(): Widget | undefined

    widget(widget?: Widget): this {
      this._widget = widget === undefined ? this.guessWidget() : widget

      return this
    }

    getWidget() {
      return this._widget
    }

    hasWidget() {
      return this._widget !== undefined
    }
  }

  return WithWidget
}

abstract class BaseParam {
  _help: string | undefined
  readonly _name: string
  _presetValue: any

  abstract getNamePrefix(): string

  abstract getNameSuffix(): string

  constructor(name: string) {
    this._name = name
  }

  get name() {
    return this._name
  }

  getFullName() {
    return `${this.getNamePrefix()}${this.name}${this.getNameSuffix()}`
  }

  help(help: string) {
    this._help = help
    return this
  }

  getHelp() {
    return this._help
  }

  preset(presetValue: any) {
    this._presetValue = presetValue
    return this
  }

  getPresetValue() {
    return this._presetValue
  }
}

export class PropParam extends mixin(BaseParam, WithWidget, WithType) {
  _isRequired = false
  _defaultValue: any
  _isVModel: boolean

  constructor(name: string, isVModel = false) {
    super(name)
    this._isVModel = isVModel
  }

  isRequired() {
    return this._isRequired
  }

  isVModel() {
    return this._isVModel
  }

  getVModelDirective() {
    return this.name === 'modelValue' ? 'v-model' : `v-model:${this.name}`
  }

  getNamePrefix() {
    return this.getType() === 'string' ? '' : ':'
  }

  getNameSuffix() {
    return this.isRequired() ? '' : '?'
  }

  getTypeLabel() {
    const type = this.getType()

    if (type !== undefined) {
      return type
    }

    if (this._isEnum) {
      return this._enumItems.map(item => JSON.stringify(item)).join(' | ')
    }

    const presetValue = this.getPresetValue()

    if (presetValue !== undefined) {
      return typeof presetValue
    }

    return 'unknown'
  }

  guessWidget(): Widget | undefined {
    if (this._isEnum) {
      return choice(...this._enumItems)
    }

    if (this._isObject) {
      return object()
    }

    switch (this.getTypeLabel()) {
      case 'boolean':
        return boolean()
      case 'number':
        return number()
      case 'string':
        return text()
    }
  }

  required() {
    this._isRequired = true
    return this
  }

  default(defaultValue: any) {
    this._defaultValue = defaultValue
    return this
  }

  getDefaultValue() {
    return this._defaultValue
  }

  bool() {
    return this.default(false).type('boolean')
  }

  num() {
    return this.type('number')
  }

  str() {
    return this.type('string')
  }

  arr(type = 'any') {
    return this.type(`${type}[]`)
  }

  _isEnum = false
  _enumItems: any[] = []

  enum(...items: any[]) {
    this._isEnum = true
    this._enumItems = items
    return this
  }

  any() {
    return this.type('any')
  }

  _isObject = false

  obj(type = 'object') {
    this._isObject = true
    return this.type(type)
  }

  _isUsingContext = false

  ctx() {
    this._isUsingContext = true
    return this
  }

  isUsingContext() {
    return this._isUsingContext
  }
}

export class EventParam extends mixin(BaseParam, WithType) {
  _args: Record<string, string> = {}
  _returnType: string | undefined
  readonly _isVModel: boolean

  constructor(name: string, isVModel = false) {
    super(name)
    this._isVModel = isVModel
  }

  get name() {
    if (this.isVModel()) {
      return `update:${super.name}`
    }

    return super.name
  }

  get rawName() {
    return super.name
  }

  isVModel() {
    return this._isVModel
  }

  getNamePrefix() {
    return '@'
  }

  getNameSuffix() {
    return ''
  }

  args(args: Record<string, string>) {
    this._args = args
    return this
  }

  getArguments() {
    return this._args
  }

  return(returnType: string) {
    this._returnType = returnType
    return this
  }

  getTypeLabel() {
    const type = this.getType()

    if (type !== undefined) {
      return type
    }

    const args: string[] = []

    Object.entries(this._args).forEach(([name, type]) => {
      args.push(`${name}: ${type}`)
    })

    return `(${args.join(', ')}) => ${this._returnType ?? 'void'}`
  }
}

export class SlotParam extends BaseParam {
  _props: { name: string; type: string }[] = []

  getNamePrefix() {
    return '#'
  }

  getNameSuffix() {
    return ''
  }

  prop(name: string, type: string) {
    this._props.push({ name, type })
    return this
  }

  getPropsType() {
    return `{ ${this._props.map(prop => `${prop.name}: ${prop.type}`).join(', ')} }`
  }

  hasProps() {
    return this._props.length > 0
  }

  get props() {
    return this._props
  }

  preset(): never {
    throw new Error('Cannot preset a slot')
  }
}

export class SettingParam extends mixin(BaseParam, WithWidget) {
  getNamePrefix() {
    return ''
  }

  getNameSuffix() {
    return ''
  }

  guessWidget(): Widget | undefined {
    const type = typeof this.getPresetValue()

    switch (type) {
      case 'string':
        return text()
    }
  }
}

export class ModelParam extends BaseParam {
  readonly _prop: PropParam
  readonly _event: EventParam

  getNameSuffix() {
    return ''
  }

  getNamePrefix() {
    return ''
  }

  constructor(name: string) {
    super(name)
    this._prop = new PropParam(name, true)
    this._event = new EventParam(name, true).args({
      value: 'unknown',
    })
  }

  prop(func: (param: PropParam) => void) {
    func(this._prop)
    return this
  }

  event(func: (param: EventParam) => void) {
    func(this._event)
    return this
  }

  required() {
    this._prop.required()
    return this
  }

  type(type: string) {
    this._prop.type(type)
    this._event.args({ value: type })
    return this
  }

  preset(presetValue: any) {
    this._prop.preset(presetValue)
    return this
  }

  help(help: string) {
    this._prop.help(help)
    return this
  }

  getPropParam() {
    return this._prop
  }

  getEventParam() {
    return this._event
  }
}

export type Param = EventParam | PropParam | SlotParam | ModelParam | SettingParam

export const prop = (name: string) => new PropParam(name)
export const event = (name: string) => new EventParam(name)
export const slot = (name = 'default') => new SlotParam(name)
export const setting = (name: string) => new SettingParam(name)
export const model = (name = 'modelValue') => new ModelParam(name)

export const isPropParam = (param: any): param is PropParam => param instanceof PropParam
export const isSettingParam = (param: any): param is SettingParam => param instanceof SettingParam
export const isEventParam = (param: any): param is EventParam => param instanceof EventParam
export const isSlotParam = (param: any): param is SlotParam => param instanceof SlotParam
export const isModelParam = (param: any): param is ModelParam => param instanceof ModelParam

export const colorProp = (name = 'color') =>
  prop(name).type('Color').enum('normal', 'success', 'warning', 'danger').default('normal').widget()

export const iconProp = (name = 'icon') =>
  prop(name)
    .type('IconName')
    .widget(choice(...Object.keys(icons)))
