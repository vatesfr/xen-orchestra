import Icon from 'icon'
import isFunction from 'lodash/isFunction'
import React from 'react'
import { Button } from 'react-bootstrap-4/lib'

import Component from './base-component'
import { autobind, propTypes } from './utils'

@propTypes({
  btnStyle: propTypes.string,
  disabled: propTypes.bool,
  form: propTypes.string,
  handler: propTypes.func.isRequired,
  handlerParam: propTypes.any,
  icon: propTypes.string.isRequired,
  redirectOnSuccess: propTypes.oneOfType(
    propTypes.func,
    propTypes.string
  ),
  size: propTypes.oneOf([
    'large',
    'small'
  ])
})
export default class ActionButton extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  @autobind
  async _execute () {
    if (this.state.working) {
      return
    }

    const {
      handler,
      handlerParam
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
      console.error(error && error.stack || error.message || error)
    }
  }

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
        style
      },
      state: { error, working }
    } = this

    return <Button
      bsStyle={error ? 'warning' : btnStyle}
      form={form}
      onClick={!form && this._execute}
      disabled={working || disabled}
      type={form ? 'submit' : 'button'}
      {...{ bsSize, className, style }}
    >
      <Icon icon={working ? 'loading' : icon} fixedWidth />
      {children && ' '}
      {children}
    </Button>
  }
}
