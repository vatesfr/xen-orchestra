import CopyToClipboard from 'react-copy-to-clipboard'
import classNames from 'classnames'
import React, { createElement } from 'react'
import PropTypes from 'prop-types'

import _ from '../intl'
import Button from '../button'
import Icon from '../icon'
import Tooltip from '../tooltip'

import styles from './index.css'

const Copiable = ({ className, tagName = 'span', ...props }) =>
  createElement(
    tagName,
    {
      ...props,
      className: classNames(styles.container, className),
    },
    props.children,
    <CopyToClipboard text={props.data || props.children}>
      <span className={styles.button}>
        <Tooltip content={_('copyToClipboard')}>
          <Button size='small'>
            <Icon icon='clipboard' />
          </Button>
        </Tooltip>
      </span>
    </CopyToClipboard>
  )

Copiable.propTypes = {
  data: PropTypes.string,
  tagName: PropTypes.string,
}

export { Copiable as default }
