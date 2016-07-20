import { messages } from 'intl'
import DocumentTitle from 'react-document-title'
import React from 'react'
import { injectIntl } from 'react-intl'

import styles from './index.css'

const Page = ({
  children,
  formatTitle,
  header,
  intl,
  title
}) => {
  const { formatMessage } = intl
  if (title == null) {
    title = 'Xen Orchestra'
  }
  return (
    <DocumentTitle title={formatTitle ? formatMessage(messages[title]) : title}>
      <div className={styles.container}>
        <nav className={'page-header ' + styles.header}>
          {header}
        </nav>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </DocumentTitle>
  )
}

Page.propTypes = {
  children: React.PropTypes.node,
  formatTitle: React.PropTypes.bool,
  header: React.PropTypes.node,
  title: React.PropTypes.string
}

export default injectIntl(Page)
