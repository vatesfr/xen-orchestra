import {
  faFloppyDisk,
  faRocket,
  faShip,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import mixin, { type MixinAbstractConstructor } from "@/libs/mixin";
import type { Widget } from "@/libs/story/story-widget";
import {
  boolean,
  choice,
  number,
  object,
  text,
} from "@/libs/story/story-widget";

function WithType(Base: MixinAbstractConstructor<BaseParam>) {
  abstract class WithType extends Base /*implements HasType*/ {
    #type: string | undefined;

    type(type: string) {
      this.#type = type;

      return this;
    }

    abstract getTypeLabel(): string;

    getType() {
      return this.#type;
    }
  }

  return WithType;
}

function WithWidget(Base: MixinAbstractConstructor<BaseParam>) {
  abstract class WithWidget extends Base /*implements HasWidget*/ {
    #widget: Widget | undefined;

    abstract guessWidget(): Widget | undefined;

    widget(widget?: Widget): this {
      this.#widget = widget === undefined ? this.guessWidget() : widget;

      return this;
    }

    getWidget() {
      return this.#widget;
    }

    hasWidget() {
      return this.#widget !== undefined;
    }
  }

  return WithWidget;
}

abstract class BaseParam {
  #help: string | undefined;
  readonly #name: string;
  #presetValue: any;

  protected abstract getNamePrefix(): string;

  protected abstract getNameSuffix(): string;

  constructor(name: string) {
    this.#name = name;
  }

  get name() {
    return this.#name;
  }

  getFullName() {
    return `${this.getNamePrefix()}${this.name}${this.getNameSuffix()}`;
  }

  help(help: string) {
    this.#help = help;
    return this;
  }

  getHelp() {
    return this.#help;
  }

  preset(presetValue: any) {
    this.#presetValue = presetValue;
    return this;
  }

  getPresetValue() {
    return this.#presetValue;
  }
}

export class PropParam extends mixin(BaseParam, WithWidget, WithType) {
  #isRequired = false;
  #defaultValue: any;

  isRequired() {
    return this.#isRequired;
  }

  getNamePrefix() {
    return this.getType() === "string" ? "" : ":";
  }

  getNameSuffix() {
    return this.isRequired() ? "" : "?";
  }

  getTypeLabel() {
    const type = this.getType();

    if (type !== undefined) {
      return type;
    }

    if (this.#isEnum) {
      return this.#enumItems.map((item) => JSON.stringify(item)).join(" | ");
    }

    const presetValue = this.getPresetValue();

    if (presetValue !== undefined) {
      return typeof presetValue;
    }

    return "unknown";
  }

  guessWidget() {
    if (this.#isEnum) {
      return choice(...this.#enumItems);
    }

    if (this.#isObject) {
      return object();
    }

    switch (this.getTypeLabel()) {
      case "boolean":
        return boolean();
      case "number":
        return number();
      case "string":
        return text();
    }
  }

  required() {
    this.#isRequired = true;
    return this;
  }

  default(defaultValue: any) {
    this.#defaultValue = defaultValue;
    return this;
  }

  getDefaultValue() {
    return this.#defaultValue;
  }

  bool() {
    return this.default(false).type("boolean");
  }

  num() {
    return this.type("number");
  }

  str() {
    return this.type("string");
  }

  arr(type = "any") {
    return this.type(`${type}[]`);
  }

  #isEnum = false;
  #enumItems: any[] = [];

  enum(...items: any[]) {
    this.#isEnum = true;
    this.#enumItems = items;
    return this;
  }

  any() {
    return this.type("any");
  }

  #isObject = false;

  obj(type = "object") {
    this.#isObject = true;
    return this.type(type);
  }
}

export class EventParam extends mixin(BaseParam, WithType) {
  #args: Record<string, string> = {};
  #returnType: string | undefined;
  readonly #isVModel: boolean;

  constructor(name: string, isVModel = false) {
    super(name);
    this.#isVModel = isVModel;
  }

  get name() {
    if (this.isVModel()) {
      return `update:${super.name}`;
    }

    return super.name;
  }

  get rawName() {
    return super.name;
  }

  isVModel() {
    return this.#isVModel;
  }

  getNamePrefix() {
    return "@";
  }

  getNameSuffix() {
    return "";
  }

  args(args: Record<string, string>) {
    this.#args = args;
    return this;
  }

  getArguments() {
    return this.#args;
  }

  return(returnType: string) {
    this.#returnType = returnType;
    return this;
  }

  getTypeLabel() {
    const type = this.getType();

    if (type !== undefined) {
      return type;
    }

    const args: string[] = [];

    Object.entries(this.#args).forEach(([name, type]) => {
      args.push(`${name}: ${type}`);
    });

    return `(${args.join(", ")}) => ${this.#returnType ?? "void"}`;
  }
}

export class SlotParam extends BaseParam {
  #props: { name: string; type: string }[] = [];

  getNamePrefix() {
    return "#";
  }

  getNameSuffix() {
    return "";
  }

  prop(name: string, type: string) {
    this.#props.push({ name, type });
    return this;
  }

  getPropsType() {
    return `{ ${this.#props
      .map((prop) => `${prop.name}: ${prop.type}`)
      .join(", ")} }`;
  }

  hasProps() {
    return this.#props.length > 0;
  }

  get props() {
    return this.#props;
  }

  preset(): never {
    throw new Error("Cannot preset a slot");
  }
}

export class SettingParam extends mixin(BaseParam, WithWidget) {
  getNamePrefix() {
    return "";
  }

  getNameSuffix() {
    return "";
  }

  guessWidget() {
    const type = typeof this.getPresetValue();

    switch (type) {
      case "string":
        return text();
    }
  }
}

export class ModelParam extends BaseParam {
  readonly #prop: PropParam;
  readonly #event: EventParam;

  protected getNameSuffix() {
    return "";
  }

  protected getNamePrefix() {
    return "";
  }

  constructor(name: string) {
    super(name);
    this.#prop = new PropParam(name);
    this.#event = new EventParam(name, true).args({
      value: "unknown",
    });
  }

  prop(func: (param: PropParam) => void) {
    func(this.#prop);
    return this;
  }

  event(func: (param: EventParam) => void) {
    func(this.#event);
    return this;
  }

  required() {
    this.#prop.required();
    return this;
  }

  type(type: string) {
    this.#prop.type(type);
    this.#event.args({ value: type });
    return this;
  }

  preset(presetValue: any) {
    this.#prop.preset(presetValue);
    return this;
  }

  help(help: string) {
    this.#prop.help(help);
    return this;
  }

  getPropParam() {
    return this.#prop;
  }

  getEventParam() {
    return this.#event;
  }
}

export type Param =
  | EventParam
  | PropParam
  | SlotParam
  | ModelParam
  | SettingParam;

export const prop = (name: string) => new PropParam(name);
export const event = (name: string) => new EventParam(name);
export const slot = (name = "default") => new SlotParam(name);
export const setting = (name: string) => new SettingParam(name);
export const model = (name = "modelValue") => new ModelParam(name);

export const isPropParam = (param: any): param is PropParam =>
  param instanceof PropParam;
export const isSettingParam = (param: any): param is SettingParam =>
  param instanceof SettingParam;
export const isEventParam = (param: any): param is EventParam =>
  param instanceof EventParam;
export const isSlotParam = (param: any): param is SlotParam =>
  param instanceof SlotParam;
export const isModelParam = (param: any): param is ModelParam =>
  param instanceof ModelParam;

export const colorProp = (name = "color") =>
  prop(name)
    .enum("info", "success", "warning", "error")
    .default("info")
    .widget();

export const iconProp = (name = "icon") =>
  prop(name)
    .type("IconDefinition")
    .widget(
      choice(
        { label: "Ship", value: faShip },
        { label: "Rocket", value: faRocket },
        { label: "Floppy", value: faFloppyDisk },
        { label: "Trash", value: faTrash }
      )
    );
