import React from 'react'

import Component from './base-component'
import Icon from './icon'
import propTypes from './prop-types'

@propTypes({
  children: propTypes.any.isRequired,
  className: propTypes.string,
  buttonText: propTypes.any.isRequired,
  defaultOpen: propTypes.bool
})
export default class Collapse extends Component {
  state = {
    isOpened: this.props.defaultOpen
  }

  _onClick = () => {
    this.setState({
      isOpened: !this.state.isOpened
    })
  }

  render () {
    const { props } = this
    const { isOpened } = this.state

    return (
      <div className={props.className}>
        <button className='btn btn-lg btn-primary btn-block' onClick={this._onClick}>
          {props.buttonText} <Icon icon={`chevron-${isOpened ? 'up' : 'down'}`} />
        </button>
        {isOpened && props.children}
      </div>
    )
  }
}
