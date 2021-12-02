import React from 'react'
import { ButtonProps, Dialog, DialogContent, DialogContentText, DialogActions, DialogTitle } from '@mui/material'
import { withState } from 'reaclette'

import Button from './Button'
import Icon, { IconName } from './Icon'
import IntlMessage from './IntlMessage'

type ModalButton = {
  color?: ButtonProps['color']
  label: string | React.ReactNode
  reason?: unknown
  value?: unknown
}

interface GeneralParamsModal {
  icon: IconName
  message: string | React.ReactNode
  title: string | React.ReactNode
}

interface ModalParams extends GeneralParamsModal {
  buttonList: ModalButton[]
}

let instance: EffectContext<State, Props, Effects, Computed, ParentState, ParentEffects> | undefined
const modal = ({ buttonList, icon, message, title }: ModalParams) =>
  new Promise((resolve, reject) => {
    if (instance === undefined) {
      throw new Error('No modal instance')
    }
    instance.state.buttonList = buttonList
    instance.state.icon = icon
    instance.state.message = message
    instance.state.onReject = reject
    instance.state.onSuccess = resolve
    instance.state.showModal = true
    instance.state.title = title
  })

export const alert = (params: GeneralParamsModal): Promise<unknown> => {
  const buttonList: ModalButton[] = [
    {
      label: <IntlMessage id='ok' />,
      color: 'primary',
      value: 'success',
    },
  ]
  return modal({ ...params, buttonList })
}

export const confirm = (params: GeneralParamsModal): Promise<unknown> => {
  const buttonList: ModalButton[] = [
    {
      label: <IntlMessage id='confirm' />,
      value: 'confirm',
      color: 'success',
    },
    {
      label: <IntlMessage id='cancel' />,
      color: 'secondary',
      reason: 'cancel',
    },
  ]
  return modal({ ...params, buttonList })
}

interface ParentState {}

interface State {
  buttonList?: ModalButton[]
  icon?: IconName
  message?: string | React.ReactNode
  onReject?: (reason: unknown) => void
  onSuccess?: (value: unknown) => void
  showModal: boolean
  title?: string | React.ReactNode
}

interface Props {}

interface ParentEffects {}

interface Effects {
  closeModal: () => void
  reject: (reason: unknown) => void
}

interface Computed {}

const Modal = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      buttonList: undefined,
      icon: undefined,
      message: undefined,
      onReject: undefined,
      onSuccess: undefined,
      showModal: false,
      title: undefined,
    }),
    effects: {
      initialize: function () {
        if (instance !== undefined) {
          throw new Error('Modal is a singelton')
        }
        instance = this
      },
      closeModal: function () {
        this.state.showModal = false
      },
      reject: function (reason) {
        this.state.onReject?.(reason)
        this.effects.closeModal()
      },
    },
  },
  ({ effects, state }) => {
    const { closeModal, reject } = effects
    const { buttonList, icon, message, onReject, onSuccess, showModal, title } = state

    return showModal ? (
      <Dialog open={showModal} onClose={reject}>
        <DialogTitle>
          {icon !== undefined && <Icon icon={icon} />} {title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          {buttonList?.map(({ label, reason, value, ...props }, index) => {
            const onClick = () => {
              if (value !== undefined) {
                onSuccess?.(value)
              } else {
                onReject?.(reason)
              }
              closeModal()
            }
            return (
              <Button key={index} onClick={onClick} {...props}>
                {label}
              </Button>
            )
          })}
        </DialogActions>
      </Dialog>
    ) : null
  }
)

export default Modal
