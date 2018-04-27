import React from 'react'
import { isFunction, startsWith } from 'lodash'

import Button from './button'
import Component from './base-component'
import Icon from './icon'
import logError from './log-error'
import propTypes from './prop-types-decorator'
import Tooltip from './tooltip'
import { error as _error } from './notification'

@propTypes({
  // React element to use as button content
  children: propTypes.node,

  // whether this button is disabled (default to false)
  disabled: propTypes.bool,

  // form identifier
  //
  // if provided, this button and its action are associated to this
  // form for the submit event
  form: propTypes.string,

  // function to call when the action is triggered (via a clik on the
  // button or submit on the form)
  handler: propTypes.func.isRequired,

  // optional value which will be passed as first param to the handler
  //
  // if you need multiple values, you can provide `data-*` props instead of
  // `handlerParam`
  handlerParam: propTypes.any,

  // XO icon to use for this button
  icon: propTypes.string.isRequired,

  // whether the action of this action is already underway
  pending: propTypes.bool,

  // path to redirect to when the triggered action finish successfully
  //
  // if a function, it will be called with the result of the action to
  // compute the path
  redirectOnSuccess: propTypes.oneOfType([propTypes.func, propTypes.string]),

  // React element to use tooltip for the component
  tooltip: propTypes.node,
})
export default class ActionButton extends Component {
  static contextTypes = {
    router: propTypes.object,
  }

  async _execute () {
    const { props } = this

    if (props.pending || this.state.working) {
      return
    }

    const { children, handler, tooltip } = props

    let handlerParam
    if ('handlerParam' in props) {
      handlerParam = props.handlerParam
    } else {
      let empty = true
      handlerParam = {}
      Object.keys(props).forEach(key => {
        if (startsWith(key, 'data-')) {
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
      if (redirectOnSuccess) {
        return this.context.router.push(
          isFunction(redirectOnSuccess)
            ? redirectOnSuccess(result, handlerParam)
            : redirectOnSuccess
        )
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
        logError(error)
        _error(
          children || tooltip || error.name,
          error.message || String(error)
        )
      }
    }
  }
  _execute = ::this._execute

  _eventListener = event => {
    event.preventDefault()
    this._execute()
  }

  componentDidMount () {
    const { form } = this.props

    if (form) {
      document
        .getElementById(form)
        .addEventListener('submit', this._eventListener)
    }
  }

  componentWillUnmount () {
    const { form } = this.props

    if (form) {
      document
        .getElementById(form)
        .removeEventListener('submit', this._eventListener)
    }
  }

  render () {
    const {
      props: { children, icon, pending, tooltip, ...props },
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
        <Icon icon={pending || working ? 'loading' : icon} fixedWidth />
        {children && ' '}
        {children}
      </Button>
    )

    return tooltip ? <Tooltip content={tooltip}>{button}</Tooltip> : button
  }
}
