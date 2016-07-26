import classNames from 'classnames'
import React from 'react'
import ReactDOM from 'react-dom'
import ReactTether from 'react-tether'

import Component from '../base-component'
import propTypes from '../prop-types'

import styles from './index.css'

// ===================================================================

@propTypes({
  children: propTypes.any.isRequired,
  className: propTypes.string,
  content: propTypes.any.isRequired,
  style: propTypes.object
})
export default class Tooltip extends Component {
  componentDidMount () {
    this._addListeners()
  }

  componentWillUnmount () {
    this._removeListeners()
  }

  componentWillReceiveProps (props) {
    if (props.children !== this.props.children) {
      this._removeListeners()
    }
  }

  componentDidUpdate (prevProps) {
    if (prevProps.children !== this.props.children) {
      this._addListeners()
    }
  }

  _addListeners () {
    const node = this._node = ReactDOM.findDOMNode(this)

    node.addEventListener('mouseenter', this._showTooltip)
    node.addEventListener('mouseleave', this._hideTooltip)
  }

  _removeListeners () {
    const node = this._node

    if (!node) {
      return
    }

    node.removeEventListener('mouseenter', this._showTooltip)
    node.removeEventListener('mouseleave', this._hideTooltip)

    this._node = null
  }

  _showTooltip = () => {
    this.setState({ show: true })
  }

  _hideTooltip = () => {
    this.setState({ show: false })
  }

  render () {
    const {
      children,
      content,
      style,
      className
    } = this.props
    const { show } = this.state

    return (
      <ReactTether
        attachment='top right'
        offset='0 -100%'
        constraints={[{
          pin: true,
          to: 'window',
          attachment: 'together'
        }]}
      >
        {children}
        <div
          className={classNames(show ? styles.tooltipEnabled : styles.tooltipDisabled, className)}
          style={style}
        >
          {content}
        </div>
      </ReactTether>
    )
  }
}
