export type WidgetType =
  | "select"
  | "radio"
  | "boolean"
  | "text"
  | "object"
  | "static"
  | "number";

export abstract class Widget {
  #type: WidgetType;

  protected constructor(type: WidgetType) {
    this.#type = type;
  }

  get type() {
    return this.#type;
  }

  protected set type(type: WidgetType) {
    this.#type = type;
  }
}

const hasOwn = (obj: object, ...properties: PropertyKey[]) => {
  return properties.every((property) =>
    Object.prototype.hasOwnProperty.call(obj, property)
  );
};

class ChoiceWidget extends Widget {
  #choices: any[];
  #isEnum = false;

  constructor(choices: any[]) {
    super("select");
    this.#choices = choices;
  }

  get choices(): { label: any; value: any }[] {
    return this.#choices.map((choice) => {
      if (hasOwn(choice, "label", "value")) {
        return choice;
      }

      return { label: choice, value: choice };
    });
  }

  enum() {
    this.#isEnum = true;
  }

  radio() {
    this.type = "radio";
    return this;
  }
}

class TextWidget extends Widget {
  constructor() {
    super("text");
  }
}

class NumberWidget extends Widget {
  constructor() {
    super("number");
  }
}

class BooleanWidget extends Widget {
  constructor() {
    super("boolean");
  }
}

class ObjectWidget extends Widget {
  constructor() {
    super("object");
  }
}

export const choice = (...choices: any[]) => new ChoiceWidget(choices);
export const text = () => new TextWidget();
export const number = () => new NumberWidget();
export const boolean = () => new BooleanWidget();
export const object = () => new ObjectWidget();

export const isSelectWidget = (widget: Widget): widget is ChoiceWidget =>
  widget.type === "select";

export const isRadioWidget = (widget: Widget): widget is ChoiceWidget =>
  widget.type === "radio";

export const isChoiceWidget = (widget: Widget): widget is ChoiceWidget =>
  isSelectWidget(widget) || isRadioWidget(widget);

export const isBooleanWidget = (widget: Widget): widget is BooleanWidget =>
  widget.type === "boolean";

export const isNumberWidget = (widget: Widget): widget is NumberWidget =>
  widget.type === "number";

export const isTextWidget = (widget: Widget): widget is TextWidget =>
  widget.type === "text";

export const isObjectWidget = (widget: Widget): widget is ObjectWidget =>
  widget.type === "object";
