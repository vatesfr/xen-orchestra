import classNames from 'classnames'
import React, { PropTypes } from 'react'

import styles from './index.css'

const Tooltip = ({
  children,
  className,
  content,
  tagName: Component = 'span'
}) => (
  <Component className={classNames(className, styles.container)}>
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
  tagName: PropTypes.string
}

export { Tooltip as default }
