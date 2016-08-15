import _ from 'intl'
import CopyToClipboard from 'react-copy-to-clipboard'
import classNames from 'classnames'
import Tooltip from 'tooltip'
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
  <Tooltip content={_('copyToClipboard')}>
    <CopyToClipboard text={props.data || props.children}>
      <button className={classNames('btn btn-sm btn-secondary', styles.button)}>
        <Icon icon='clipboard' />
      </button>
    </CopyToClipboard>
  </Tooltip>
))
export { Copiable as default }
