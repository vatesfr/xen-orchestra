import classNames from 'classnames'
import isFunction from 'lodash/isFunction'
import React from 'react'

import Component from './base-component'
import Icon from './icon'
import logError from './log-error'
import propTypes from './prop-types'
import Tooltip from './tooltip'
import { error as _error } from './notification'

@propTypes({
  // Bootstrap button style (https://v4-alpha.getbootstrap.com/components/buttons/#examples)
  btnStyle: propTypes.string,

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
  handlerParam: propTypes.any,

  // XO icon to use for this button
  icon: propTypes.string.isRequired,

  // path to redirect to when the triggered action finish successfully
  //
  // if a function, it will be called with the result of the action to
  // compute the path
  redirectOnSuccess: propTypes.oneOfType([
    propTypes.func,
    propTypes.string
  ]),

  size: propTypes.oneOf([
    'large',
    'small'
  ]),

  // React element to use tooltip for the component
  tooltip: propTypes.node
})
export default class ActionButton extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  async _execute () {
    if (this.state.working) {
      return
    }

    const {
      children,
      handler,
      handlerParam,
      tooltip
    } = this.props

    try {
      this.setState({
        error: null,
        working: true
      })

      const result = await handler(handlerParam)

      let { redirectOnSuccess } = this.props
      if (redirectOnSuccess) {
        if (isFunction(redirectOnSuccess)) {
          redirectOnSuccess = redirectOnSuccess(result)
        }
        return this.context.router.push(redirectOnSuccess)
      }

      this.setState({
        working: false
      })
    } catch (error) {
      this.setState({
        error,
        working: false
      })

      // ignore when undefined because it usually means that the action has been canceled
      if (error !== undefined) {
        logError(error)
        _error(children || tooltip || error.name, error.message || String(error))
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
      document.getElementById(form).addEventListener('submit', this._eventListener)
    }
  }

  componentWillUnmount () {
    const { form } = this.props

    if (form) {
      document.getElementById(form).removeEventListener('submit', this._eventListener)
    }
  }

  render () {
    const {
      props: {
        btnStyle,
        children,
        className,
        disabled,
        form,
        icon,
        size: bsSize,
        style,
        tooltip
      },
      state: { error, working }
    } = this

    const button = <button
      className={classNames(
        'btn',
        btnStyle !== undefined && `btn-${btnStyle}`,
        bsSize === 'large' ? 'btn-lg' : bsSize === 'small' ? 'btn-sm' : null,
        className
      )}
      bsStyle={error ? 'warning' : btnStyle}
      form={form}
      onClick={!form && this._execute}
      disabled={working || disabled}
      type={form ? 'submit' : 'button'}
      style={style}
    >
      <Icon icon={working ? 'loading' : icon} fixedWidth />
      {children && ' '}
      {children}
    </button>

    return tooltip
      ? <Tooltip content={tooltip}>{button}</Tooltip>
      : button
  }
}
