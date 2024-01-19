export type Color = 'info' | 'error' | 'warning' | 'success'

export type ModalController = {
  id: symbol
  component: any
  props: object
  approve: <P>(payload?: P) => void
  decline: () => void
  isBusy: boolean
}
