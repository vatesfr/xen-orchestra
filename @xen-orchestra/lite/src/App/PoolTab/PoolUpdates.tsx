import React from 'react'
import humanFormat from 'human-format'
import { withState } from 'reaclette'

import IntlMessage from '../../components/IntlMessage'
import Table, { Column } from '../../components/Table'
import XapiConnection, { ObjectsByType, PoolUpdate } from '../../libs/xapi'

const COLUMN: Column<PoolUpdate>[] = [
  {
    header: <IntlMessage id='name' />,
    render: update => update.name,
  },
  {
    header: <IntlMessage id='description' />,
    render: update => update.description,
  },
  {
    header: <IntlMessage id='version' />,
    render: update => update.version,
  },
  {
    header: <IntlMessage id='release' />,
    render: update => update.release,
  },
  {
    header: <IntlMessage id='size' />,
    render: update => humanFormat.bytes(update.size),
  },
]

interface ParentState {
  objectsByType: ObjectsByType
  objectsFetched: boolean
  xapi: XapiConnection
}

interface State {}

interface Props {
  hostRef: string
}

interface ParentEffects {}

interface Effects {}

interface Computed {
  availableUpdates?: PoolUpdate[] | JSX.Element
}

const PoolUpdates = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      availableUpdates: async function (state, { hostRef }) {
        try {
          const stringifiedPoolUpdates = (await state.xapi.call(
            'host.call_plugin',
            hostRef,
            'updater.py',
            'check_update',
            {}
          )) as string
          return JSON.parse(stringifiedPoolUpdates)
        } catch (err) {
          console.error(err)
          return <IntlMessage id='errorOccurred' />
        }
      },
    },
  },
  ({ state: { availableUpdates } }) =>
    availableUpdates !== undefined ? (
      Array.isArray(availableUpdates) ? (
        <>
          {availableUpdates.length !== 0 && (
            <IntlMessage id='availableUpdates' values={{ nUpdates: availableUpdates.length }} />
          )}
          <Table collection={availableUpdates} columns={COLUMN} placeholder={<IntlMessage id='noUpdatesAvailable' />} />
        </>
      ) : (
        availableUpdates
      )
    ) : (
      <IntlMessage id='loading' />
    )
)

export default PoolUpdates
