import Icon from 'icon'
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
  size: propTypes.oneOf([
    'large',
    'small'
  ]),
  type: propTypes.string
})
export default class ActionButton extends Component {
  @autobind
  async _execute () {
    if (this.state.working) {
      return
    }

    const { handler, handlerParam } = this.props
    try {
      this.setState({
        error: null,
        working: true
      })
      await handler(handlerParam)
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
    const { props } = this

    if (props.type === 'submit') {
      document.getElementById(props.form).addEventListener('submit', this._eventListener)
    }
  }

  componentWillUnmount () {
    if (this.props.type === 'submit') {
      document.getElementById(this.props.form).removeEventListener('submit', this._eventListener)
    }
  }

  render () {
    const {
      props: {
        btnStyle,
        children,
        className,
        disabled,
        icon,
        size: bsSize,
        style,
        type = 'button'
      },
      state: { error, working }
    } = this

    return <Button
      bsStyle={error ? 'warning' : btnStyle}
      disabled={working || disabled}
      onClick={type !== 'submit' && this._execute}
      ref='button'
      {...{ bsSize, className, style, type }}
    >
      <Icon icon={working ? 'loading' : icon} fixedWidth />
      {children && ' '}
      {children}
    </Button>
  }
}
