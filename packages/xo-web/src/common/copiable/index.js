import CopyToClipboard from 'react-copy-to-clipboard'
import classNames from 'classnames'
import React, { createElement } from 'react'

import _ from '../intl'
import Button from '../button'
import Icon from '../icon'
import propTypes from '../prop-types-decorator'
import Tooltip from '../tooltip'

import styles from './index.css'

const Copiable = propTypes({
  data: propTypes.string,
  tagName: propTypes.string,
})(({ className, tagName = 'span', ...props }) =>
  createElement(
    tagName,
    {
      ...props,
      className: classNames(styles.container, className),
    },
    props.children,
    ' ',
    <Tooltip content={_('copyToClipboard')}>
      <CopyToClipboard text={props.data || props.children}>
        <Button className={styles.button} size='small'>
          <Icon icon='clipboard' />
        </Button>
      </CopyToClipboard>
    </Tooltip>
  )
)
export { Copiable as default }
