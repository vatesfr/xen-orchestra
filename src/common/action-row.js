import Icon from 'icon'
import React, { Component } from 'react'
import { autobind, propTypes } from 'utils'
import { Button } from 'react-bootstrap-4/lib'

@propTypes({
  btnStyle: propTypes.string,
  handler: propTypes.func.isRequired,
  icon: propTypes.string.isRequired
})
export default class ActionRow extends Component {
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
        icon
      },
      state: { error, working }
    } = this

    return <Button
      bsSize='small'
      bsStyle={error ? 'warning' : btnStyle}
      disabled={working}
      onClick={this._execute}
      style={{ marginLeft: '0.5em' }}

    >
      <Icon icon={working ? 'loading' : icon} fixedWidth />
      {children && ' '}
      {children}
    </Button>
  }
}
