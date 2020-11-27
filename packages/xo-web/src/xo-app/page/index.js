import { messages } from 'intl'
import DocumentTitle from 'react-document-title'
import PropTypes from 'prop-types'
import React from 'react'
import { injectIntl } from 'react-intl'

import styles from './index.css'

const Page = ({ children, collapsedHeader, formatTitle, header, intl, title }) => {
  const { formatMessage } = intl

  const content = (
    <div className={styles.container}>
      {!collapsedHeader && <nav className={'page-header ' + styles.header}>{header}</nav>}
      <div className={styles.content}>{children}</div>
    </div>
  )

  return title ? (
    <DocumentTitle title={formatTitle ? formatMessage(messages[title]) : title}>{content}</DocumentTitle>
  ) : (
    content
  )
}

Page.propTypes = {
  children: PropTypes.node,
  collapsedHeader: PropTypes.bool,
  formatTitle: PropTypes.bool,
  header: PropTypes.node,
  title: PropTypes.string,
}

export default injectIntl(Page)
