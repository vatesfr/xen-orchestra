import CopyToClipboard from 'react-copy-to-clipboard'
import classNames from 'classnames'
import React, { createElement } from 'react'
import PropTypes from 'prop-types'

import _ from '../intl'
import Button from '../button'
import Icon from '../icon'
import Tooltip from '../tooltip'

import styles from './index.css'

const Copiable = ({
  className,
  tagName = 'span',
  tooltip = _('copyToClipboard'),
  ...props
}) =>
  createElement(
    tagName,
    {
      ...props,
      className: classNames(styles.container, className),
    },
    props.children,
    ' ',
    <Tooltip content={tooltip}>
      <CopyToClipboard text={props.data || props.children}>
        <Button className={styles.button} size='small'>
          <Icon icon='clipboard' />
        </Button>
      </CopyToClipboard>
    </Tooltip>
  )

Copiable.propTypes = {
  data: PropTypes.string,
  tagName: PropTypes.string,
  tooltip: PropTypes.node,
}

export { Copiable as default }
