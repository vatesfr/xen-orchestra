import CopyToClipboard from 'react-copy-to-clipboard'
import classNames from 'classnames'
import React, { createElement } from 'react'

import Icon from '../icon'
import propTypes from '../prop-types'

import styles from './index.css'

const Copiable = propTypes({
  data: propTypes.string,
  tagName: propTypes.string
})(props => createElement(
  props.tagName || 'span',
  {
    ...props,
    className: classNames(styles.container, props.className)
  },
  props.children,
  ' ',
  <CopyToClipboard text={props.data || props.children}>
    <button className={classNames('btn btn-sm btn-secondary', styles.button)}>
      <Icon icon='clipboard' />
    </button>
  </CopyToClipboard>
))
export { Copiable as default }
