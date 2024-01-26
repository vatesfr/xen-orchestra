import React from 'react'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import PropTypes from 'prop-types'
import decorate from 'apply-decorators'
import { injectState, provideState } from 'reaclette'
import Copiable from 'copiable'
import { flatMap } from 'lodash'
import Link from 'link'
import store from 'store'

/**
 * TODO : check user permissions on objects retrieved by refs, if using the component in non-admin pages
 */
const RichText = decorate([
  connectStore({
    vms: createGetObjectsOfType('VM'),
    hosts: createGetObjectsOfType('host'),
    pools: createGetObjectsOfType('pool'),
    srs: createGetObjectsOfType('SR'),
  }),
  provideState({
    computed: {
      idToLink: (_, props) => {
        const regex = /\b(?:OpaqueRef:)?[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/g
        const parts = props.message.split(regex)
        const ids = props.message.match(regex) || []
        const { objects } = store.getState()

        return flatMap(parts, (part, index) => {
          // If on last part, return only the part without adding Copiable component
          if (index === ids.length) {
            return part
          }

          const id = ids[index]
          let _object

          for (const collection of [props.vms, props.hosts, props.pools, props.srs]) {
            _object = id.startsWith('OpaqueRef:') ? objects.byRef.get(id) : collection[id]

            if (_object !== undefined) break
          }

          if (_object !== undefined && ['VM', 'host', 'pool', 'SR'].includes(_object.type)) {
            return [
              part,
              <Link key={index} to={`/${_object.type.toLowerCase()}s/${_object.uuid}`}>
                {id}
              </Link>,
            ]
          } else {
            return [part, <Copiable key={index}>{id}</Copiable>]
          }
        })
      },
    },
  }),
  injectState,
  ({ state: { idToLink }, copiable, message }) =>
    copiable ? (
      <Copiable tagName='pre' data={message}>
        {idToLink}
      </Copiable>
    ) : (
      <pre>{idToLink}</pre>
    ),
])

RichText.propTypes = {
  message: PropTypes.string,
  copiable: PropTypes.bool,
}

RichText.defaultProps = {
  copiable: false,
}

export default RichText
