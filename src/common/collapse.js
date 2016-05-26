import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import { propTypes } from 'utils'

@propTypes({
  children: propTypes.any.isRequired,
  className: propTypes.string,
  buttonText: propTypes.any.isRequired
})
export default class Collapse extends Component {
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
