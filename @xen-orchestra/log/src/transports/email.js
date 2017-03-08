import prettyFormat from 'pretty-format' // eslint-disable-line node/no-extraneous-import
import { createTransport } from 'nodemailer' // eslint-disable-line node/no-extraneous-import
import { fromCallback } from 'promise-toolbox'

import { evalTemplate, required } from '../utils'
import { NAMES } from '../levels'

export default ({
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
}) => {
  const transporter = createTransport(
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
          subject: evalTemplate(
            subject,
            key =>
              key === 'level'
                ? NAMES[log.level]
                : key === 'time' ? log.time.toISOString() : log[key]
          ),
          text: prettyFormat(log.data),
        },
        cb
      )
    )
}
