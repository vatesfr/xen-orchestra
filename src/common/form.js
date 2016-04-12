import classNames from 'classnames'
import Icon from 'icon'
import randomPassword from 'random-password'
import React, { Component } from 'react'
import { autobind, propTypes } from 'utils'

// ===================================================================

@propTypes({
  enableGenerator: propTypes.bool
})
export class Password extends Component {
  constructor (props) {
    super(props)

    this.state = {}
  }

  get value () {
    return this.refs.field.value
  }

  set value (value) {
    this.refs.field.value = value
  }

  @autobind
  _generate () {
    this.refs.field.value = randomPassword(8)
    this.setState({
      visible: true
    })
  }

  @autobind
  _toggleVisibility () {
    this.setState({
      visible: !this.state.visible
    })
  }

  render () {
    const {
      className,
      enableGenerator = true,
      ...props
    } = this.props
    const { visible } = this.state

    return <div className='input-group'>
      {enableGenerator && <span className='input-group-btn'>
        <button type='button' className='btn btn-secondary' onClick={this._generate}>
          <Icon icon='password' />
        </button>
      </span>}
      <input
        {...props}
        className={classNames(className, 'form-control')}
        ref='field'
        type={visible ? 'text' : 'password'}
      />
      <span className='input-group-btn'>
        <button type='button' className='btn btn-secondary' onClick={this._toggleVisibility}>
          <Icon icon={visible ? 'shown' : 'hidden'} />
        </button>
      </span>
    </div>
  }
}
