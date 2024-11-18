'use strict'

const fromCallback = require('promise-toolbox/fromCallback')
const nodemailer = require('nodemailer') // eslint-disable-line n/no-extraneous-require
const prettyFormat = require('pretty-format') // eslint-disable-line n/no-extraneous-require

const { evalTemplate, required } = require('../_utils')
const { NAMES } = require('../levels')

function createTransport({
  // transport options (https://nodemailer.com/smtp/)
  auth,
  authMethod,
  host,
  ignoreTLS,
  port,
  proxy,
  requireTLS,
  secure,
  service,
  tls,

  // message options (https://nodemailer.com/message/)
  bcc,
  cc,
  from = required('from'),
  to = required('to'),
  subject = '[{{level}} - {{namespace}}] {{time}} {{message}}',
}) {
  const transporter = nodemailer.createTransport(
    {
      auth,
      authMethod,
      host,
      ignoreTLS,
      port,
      proxy,
      requireTLS,
      secure,
      service,
      tls,

      disableFileAccess: true,
      disableUrlAccess: true,
    },
    {
      bcc,
      cc,
      from,
      to,
    }
  )

  return log =>
    fromCallback(cb =>
      transporter.sendMail(
        {
          subject: evalTemplate(subject, key =>
            key === 'level' ? NAMES[log.level] : key === 'time' ? log.time.toISOString() : log[key]
          ),
          text: prettyFormat(log.data),
        },
        cb
      )
    )
}

module.exports = exports = createTransport
