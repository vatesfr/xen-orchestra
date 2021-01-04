import React from 'react'
import PropTypes from 'prop-types'

import Button from './button'
import Component from './base-component'
import Icon from './icon'

export default class Collapse extends Component {
  static propTypes = {
    buttonText: PropTypes.any.isRequired,
    children: PropTypes.any.isRequired,
    className: PropTypes.string,
    defaultOpen: PropTypes.bool,
    size: PropTypes.string,
  }

  state = {
    isOpened: this.props.defaultOpen,
  }

  _onClick = () => {
    this.setState({
      isOpened: !this.state.isOpened,
    })
  }

  render() {
    const { props } = this
    const { isOpened } = this.state

    return (
      <div className={props.className}>
        <Button block btnStyle='primary' onClick={this._onClick} size={props.size || 'large'}>
          {props.buttonText} <Icon icon={`chevron-${isOpened ? 'up' : 'down'}`} />
        </Button>
        {isOpened && props.children}
      </div>
    )
  }
}
