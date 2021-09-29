import PropTypes from 'prop-types'
import React from 'react'

import Button from './button'
import Component from './base-component'
import Icon from './icon'
import logError from './log-error'
import Tooltip from './tooltip'
import UserError from './user-error'
import { error as _error } from './notification'

export default class ActionButton extends Component {
  static GO_BACK = 1

  static contextTypes = {
    router: PropTypes.object,
  }

  static propTypes = {
    // React element to use as button content
    children: PropTypes.node,

    // whether this button is disabled (default to false)
    disabled: PropTypes.bool,

    // form identifier
    //
    // if provided, this button and its action are associated to this
    // form for the submit event
    form: PropTypes.string,

    // function to call when the action is triggered (via a clik on the
    // button or submit on the form)
    handler: PropTypes.func.isRequired,

    // optional value which will be passed as first param to the handler
    //
    // if you need multiple values, you can provide `data-*` props instead of
    // `handlerParam`
    handlerParam: PropTypes.any,

    // XO icon to use for this button
    icon: PropTypes.string.isRequired,

    // the color of the xo icon
    iconColor: PropTypes.string,

    // whether the action of this action is already underway
    pending: PropTypes.bool,

    // path to redirect to when the triggered action finish successfully
    //
    // if a function, it will be called with the result of the action to
    // compute the path
    redirectOnSuccess: PropTypes.oneOfType([PropTypes.func, PropTypes.string, PropTypes.oneOf([this.GO_BACK])]),

    // React element to use tooltip for the component
    tooltip: PropTypes.node,
  }

  async _execute() {
    const { props } = this

    if (props.pending || this.state.working) {
      return
    }

    const { children, handler, tooltip } = props

    let handlerParam
    if (props.handlerParam !== undefined) {
      handlerParam = props.handlerParam
    } else {
      let empty = true
      handlerParam = {}
      Object.keys(props).forEach(key => {
        if (key.startsWith('data-')) {
          empty = false
          handlerParam[key.slice(5)] = props[key]
        }
      })
      if (empty) {
        handlerParam = undefined
      }
    }

    try {
      this.setState({
        error: undefined,
        working: true,
      })

      const result = await handler(handlerParam)

      const { redirectOnSuccess } = props
      if (redirectOnSuccess !== undefined) {
        if (redirectOnSuccess === ActionButton.GO_BACK) {
          return this.context.router.goBack()
        }
        let to
        switch (typeof redirectOnSuccess) {
          case 'string':
            to = redirectOnSuccess
            break
          case 'function':
            to = redirectOnSuccess(result, handlerParam)
            break
          default:
            throw new Error(`Redirect on success ${redirectOnSuccess} type unknown ${typeof redirectOnSuccess}`)
        }
        if (to !== undefined) {
          return this.context.router.push(to)
        }
      }

      this.setState({
        working: false,
      })
    } catch (error) {
      this.setState({
        error,
        working: false,
      })

      // ignore when undefined because it usually means that the action has been canceled
      if (error !== undefined) {
        if (error instanceof UserError) {
          _error(error.title, error.body)
        } else {
          logError(error)
          _error(children || tooltip || error.name, error.message || String(error))
        }
      }
    }
  }
  _execute = ::this._execute

  _eventListener = event => {
    event.preventDefault()
    this._execute()
  }

  componentDidMount() {
    const { form } = this.props

    if (form) {
      document.getElementById(form).addEventListener('submit', this._eventListener)
    }
  }

  componentWillUnmount() {
    const { form } = this.props

    if (form) {
      document.getElementById(form).removeEventListener('submit', this._eventListener)
    }
  }

  render() {
    const {
      props: { children, icon, iconColor, pending, tooltip, ...props },
      state: { error, working },
    } = this

    if (error !== undefined) {
      props.btnStyle = 'warning'
    }
    if (pending || working) {
      props.disabled = true
    }
    delete props.handler
    delete props.handlerParam
    if (props.form === undefined) {
      props.onClick = this._execute
    }
    delete props.redirectOnSuccess

    const button = (
      <Button {...props}>
        <Icon color={iconColor} fixedWidth icon={pending || working ? 'loading' : icon} />
        {children && ' '}
        {children}
      </Button>
    )

    return tooltip ? <Tooltip content={tooltip}>{button}</Tooltip> : button
  }
}
