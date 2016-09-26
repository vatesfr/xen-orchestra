
import isFunction from 'lodash/isFunction'
import isString from 'lodash/isString'
import moment from 'moment'
import React, {
  Component,
  PropTypes
} from 'react'
import {
  connect
} from 'react-redux'
import {
  FormattedMessage,
  IntlProvider as IntlProvider_
} from 'react-intl'

import messages from './messages'
import locales from './locales'

// ===================================================================

// Params:
//
// - props (optional): properties to add to the FormattedMessage
// - messageId: identifier of the message to format/translate
// - values (optional): values to pass to the message
// - render (optional): a function receiving the React nodes of the
//     translated message and returning the React node to render
const getMessage = (props, messageId, values, render) => {
  if (isString(props)) {
    render = values
    values = messageId
    messageId = props
    props = undefined
  }

  const message = messages[messageId]
  if (process.env.NODE_ENV !== 'production' && !message) {
    throw new Error(`no message defined for ${messageId}`)
  }

  if (isFunction(values)) {
    render = values
    values = undefined
  }

  return <FormattedMessage {...props} {...message} values={values}>
    {render}
  </FormattedMessage>
}

export { getMessage as default }

export { messages }

@connect(({ lang }) => ({ lang }))
export class IntlProvider extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    lang: PropTypes.string.isRequired
  };

  render () {
    const { lang, children } = this.props
    return <IntlProvider_
      locale={lang}
      messages={locales[lang]}
    >
      {children}
    </IntlProvider_>
  }
}

@connect(({ lang }) => ({ lang }))
export class FormattedDuration extends Component {
  render () {
    const {
      duration,
      lang
    } = this.props
    return <span>{moment.duration(duration).locale(lang).humanize()}</span>
  }
}
