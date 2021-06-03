import React, { ElementType, ReactElement, ReactNode } from 'react'
import { FormattedMessage, MessageDescriptor } from 'react-intl'
import intlMessage from '../lang/en.json'

// See https://formatjs.io/docs/react-intl/components/#formattedmessage
interface Props extends MessageDescriptor {
  children?: (chunks: ReactElement) => ReactElement
  id?: keyof typeof intlMessage
  tagName?: ElementType
  values?: Record<string, ReactNode>
}
const IntlMessage = (props: Props): JSX.Element => <FormattedMessage {...props} />

export default IntlMessage
