import Icon from 'icon'
import React, { Component } from 'react'
import { Button } from 'react-bootstrap-4/lib'
import { autobind, propTypes } from 'utils'

@propTypes({
  btnStyle: propTypes.string,
  handler: propTypes.func.isRequired,
  icon: propTypes.string.isRequired,
  size: propTypes.oneOf([
    'large',
    'small'
  ])
})
export default class ActionButton extends Component {
  constructor () {
    super()

    this.state = {}
  }

  @autobind
  async _execute () {
    if (this.state.working) {
      return
    }

    const { handler } = this.props
    try {
      this.setState({
        error: null,
        working: true
      })
      await handler()
      this.setState({
        working: false
      })
    } catch (error) {
      this.setState({
        error,
        working: false
      })
    }
  }

  render () {
    const {
      props: {
        btnStyle,
        children,
        className,
        icon,
        size: bsSize,
        style
      },
      state: { error, working }
    } = this

    return <Button
      bsStyle={error ? 'warning' : btnStyle}
      disabled={working}
      onClick={this._execute}

      {...{ bsSize, className, style }}
    >
      <Icon icon={working ? 'loading' : icon} />
      {children && ' '}
      {children}
    </Button>
  }
}
