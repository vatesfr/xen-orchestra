import PropTypes from 'prop-types'
import React, { cloneElement } from 'react'

const SINGLE_LINE_STYLE = { display: 'flex' }
const COL_STYLE = { marginTop: 'auto', marginBottom: 'auto' }

const SingleLineRow = ({ children, className }) => (
  <div className={`${className || ''} row`} style={SINGLE_LINE_STYLE}>
    {React.Children.map(
      children,
      child => child && cloneElement(child, { style: { ...child.props.style, ...COL_STYLE } })
    )}
  </div>
)

SingleLineRow.propTypes = {
  className: PropTypes.string,
}

export { SingleLineRow as default }
