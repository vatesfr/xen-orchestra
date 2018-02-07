import React, { cloneElement } from 'react'

import propTypes from './prop-types-decorator'

const SINGLE_LINE_STYLE = { display: 'flex' }
const COL_STYLE = { marginTop: 'auto', marginBottom: 'auto' }

const SingleLineRow = propTypes({
  className: propTypes.string,
})(({ children, className }) => (
  <div className={`${className || ''} row`} style={SINGLE_LINE_STYLE}>
    {React.Children.map(
      children,
      child => child && cloneElement(child, { style: COL_STYLE })
    )}
  </div>
))
export { SingleLineRow as default }
