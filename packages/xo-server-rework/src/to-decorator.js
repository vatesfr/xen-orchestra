// @flow

type Descriptor = {
  value: any
}

const toDecorator = (
  wrapFunction: Function,
  wrapMethod: Function = wrapFunction
) => (
  target: Function | any,
  key?: string,
  descriptor?: Descriptor
) =>
  descriptor === undefined
    ? wrapFunction(target)
    : {
      ...descriptor,
      value: (typeof target === 'function' ? wrapFunction : wrapMethod)(
        descriptor.value
      ),
    }
export { toDecorator as default }
