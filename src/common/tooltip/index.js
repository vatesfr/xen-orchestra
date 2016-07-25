import React from 'react'
import ReactTooltip from 'react-tooltip'

import Component from '../base-component'
import propTypes from '../prop-types'

const generateId = (() => {
  let id = Number.MIN_SAFE_INTEGER

  return () => {
    if (id === Number.MAX_SAFE_INTEGER) {
      id = Number.MIN_SAFE_INTEGER
    }

    return id++
  }
})()

@propTypes({
  children: propTypes.any.isRequired,
  className: propTypes.string,
  content: propTypes.any.isRequired,
  style: propTypes.object,
  tagName: propTypes.string
})
export default class Tooltip extends Component {
  constructor (props) {
    super(props)
    this.state.id = generateId()
  }

  render () {
    const {
      className,
      children,
      content,
      style,
      tagName: Component = 'span'
    } = this.props
    const { id } = this.state

    return (
      <Component className={className || ''} style={style}>
        <a data-tip data-for={id}>
          {children}
        </a>
        <ReactTooltip id={id}>
          <div>{content}</div>
        </ReactTooltip>
      </Component>
    )
  }
}
