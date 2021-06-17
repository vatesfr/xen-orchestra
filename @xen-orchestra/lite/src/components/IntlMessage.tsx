import React, { ElementType, ReactElement, ReactNode } from 'react'
import { FormattedMessage, MessageDescriptor } from 'react-intl'
import intlMessage from '../lang/en.json'

// Extends FormattedMessage not working: "FormattedMessage refers to a value, but is being used as a type here"
// https://stackoverflow.com/questions/62059408/reactjs-and-typescript-refers-to-a-value-but-is-being-used-as-a-type-here-ts
// InstanceType<typeof FormattedMessage> not working: "Type [...] does not satisfy the constraint abstract new (...args: any) => any."
// See https://formatjs.io/docs/react-intl/components/#formattedmessage
interface Props extends MessageDescriptor {
  children?: (chunks: ReactElement) => ReactElement
  id?: keyof typeof intlMessage
  tagName?: ElementType
  values?: Record<string, ReactNode>
}
const IntlMessage = (props: Props): JSX.Element => <FormattedMessage {...props} />

export default React.memo(IntlMessage)
