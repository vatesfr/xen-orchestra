import React from 'react'

import Button from './button'
import Component from './base-component'
import Icon from './icon'
import propTypes from './prop-types-decorator'

@propTypes({
  children: propTypes.any.isRequired,
  className: propTypes.string,
  buttonText: propTypes.any.isRequired,
  defaultOpen: propTypes.bool,
})
export default class Collapse extends Component {
  state = {
    isOpened: this.props.defaultOpen,
  }

  _onClick = () => {
    this.setState({
      isOpened: !this.state.isOpened,
    })
  }

  render () {
    const { props } = this
    const { isOpened } = this.state

    return (
      <div className={props.className}>
        <Button block btnStyle='primary' size='large' onClick={this._onClick}>
          {props.buttonText}{' '}
          <Icon icon={`chevron-${isOpened ? 'up' : 'down'}`} />
        </Button>
        {isOpened && props.children}
      </div>
    )
  }
}
