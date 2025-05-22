import moment from 'moment'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { FormattedMessage, IntlProvider as IntlProvider_ } from 'react-intl'
import every from 'lodash/every.js'

import locales from './locales'
import messages from './messages'
import Tooltip from '.././tooltip'
import { createSelector } from '.././selectors'

// ===================================================================

// Params:
//
// - props (optional): properties to add to the FormattedMessage
// - messageId: identifier of the message to format/translate
// - values (optional): values to pass to the message
// - render (optional): a function receiving the React nodes of the
//     translated message and returning the React node to render
const getMessage = (props, messageId, values, render) => {
  if (typeof props === 'string') {
    render = values
    values = messageId
    messageId = props
    props = undefined
  }

  const message = messages[messageId]
  if (process.env.NODE_ENV !== 'production' && !message) {
    throw new Error(`no message defined for ${messageId}`)
  }

  if (typeof values === 'function') {
    render = values
    values = undefined
  }

  return (
    <FormattedMessage {...props} {...message} values={values}>
      {render}
    </FormattedMessage>
  )
}
getMessage.keyValue = (key, value) =>
  getMessage('keyValue', {
    key: <strong>{key}</strong>,
    value,
  })

export { getMessage as default }

export { messages }

@connect(({ lang }) => ({ lang }))
export class IntlProvider extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    lang: PropTypes.string.isRequired,
  }

  render() {
    const { lang, children } = this.props
    // Adding a key prop is a workaround suggested by react-intl documentation
    // to make sure changes to the locale trigger a re-render of the child components
    // https://github.com/yahoo/react-intl/wiki/Components#dynamic-language-selection
    //
    // FIXME: remove the key prop when React context propagation is fixed (https://github.com/facebook/react/issues/2517)
    return (
      <IntlProvider_ key={lang} locale={lang} messages={locales[lang]}>
        {children}
      </IntlProvider_>
    )
  }
}

const parseDuration = milliseconds => {
  let seconds = Math.floor(milliseconds / 1e3)
  const days = Math.floor(seconds / 86400)
  seconds -= days * 86400
  const hours = Math.floor(seconds / 3600)
  seconds -= hours * 3600
  const minutes = Math.floor(seconds / 60)
  seconds -= minutes * 60
  return { days, hours, minutes, seconds }
}

@connect(({ lang }) => ({ lang }))
export class FormattedDuration extends Component {
  _parseDuration = createSelector(() => this.props.duration, parseDuration)

  _humanizeDuration = createSelector(
    () => this.props.duration,
    () => this.props.lang,
    (duration, lang) => moment.duration(duration).locale(lang).humanize()
  )

  render() {
    const parsedDuration = this._parseDuration()
    return (
      <Tooltip
        content={getMessage(every(parsedDuration, n => n === 0) ? 'secondsFormat' : 'durationFormat', parsedDuration)}
      >
        <span>{this._humanizeDuration()}</span>
      </Tooltip>
    )
  }
}
