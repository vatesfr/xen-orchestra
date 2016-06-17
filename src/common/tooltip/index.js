import classNames from 'classnames'
import React, { PropTypes } from 'react'

import styles from './index.css'

const Tooltip = ({
  children,
  className,
  content,
  style,
  tagName: Component = 'span'
}) => (
  <Component className={classNames(className, styles.container)} style={style}>
    <div className={styles.arrow} />
    <div className={styles.tooltip}>
      {content}
    </div>
    {children}
  </Component>
)

Tooltip.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  content: PropTypes.any.isRequired,
  style: PropTypes.object,
  tagName: PropTypes.string
}

export { Tooltip as default }
