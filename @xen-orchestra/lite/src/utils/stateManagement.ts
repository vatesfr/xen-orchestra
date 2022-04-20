import { get, set } from 'lodash'

type CustomValueCb = (ev: any) => unknown

export type LinkState = (name: string, customValue?: CustomValueCb) => (ev: any) => void

export type LinkStateEffect = (name: string, ev: any, customValue?: CustomValueCb) => void

export type ToggleState = (name: string) => () => void

export type ToggleStateEffect = (name: string) => void

function updateStateWithNewRender(this: { state: any }, name: string, value: unknown) {
  if (this?.state === undefined) {
    console.error('state is undefined', this)
    return
  }
  if (/./.test(name)) {
    const firstPart = name.split('.').shift()!
    this.state[firstPart] = {
      ...set(this.state, name, value)[firstPart],
    }
  } else {
    this.state = {
      ...this.state,
      [name]: value,
    }
  }
}

export function linkStateEffect(this: { state: any }, name: string, ev: any, customValue?: CustomValueCb): void {
  updateStateWithNewRender.call(
    this,
    name,
    customValue !== undefined
      ? customValue(ev)
      : ev.target !== undefined
      ? ev.target.nodeName?.toLowerCase() === 'input' && ev.target?.type === 'checkbox'
        ? ev.target.checked
        : ev.target.value
      : ev
  )
}

export function toggleStateEffect(this: { state: any }, name: string): void {
  const prevValue = get(this.state, name)
  if (prevValue !== undefined && typeof prevValue !== 'boolean') {
    console.error(`${name} is not a boolean !`)
    return
  }
  updateStateWithNewRender.call(this, name, !prevValue)
}
