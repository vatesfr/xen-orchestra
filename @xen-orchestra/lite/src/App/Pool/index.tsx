import React from 'react'
import { withState } from 'reaclette'

import Dashboard from './dashboard'
import Icon from '../../components/Icon'
import PanelHeader from '../../components/PanelHeader'
import { ObjectsByType, Pool as PoolType } from '../../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
}

interface State {}

interface Props {
  id: string
}

interface ParentEffects {}

interface Effects {}

interface Computed {
  pool?: PoolType
}

// TODO: add tabs when https://github.com/vatesfr/xen-orchestra/pull/6096 is merged
const Pool = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      pool: (state, props) => state.objectsByType?.get('pool')?.get(props.id),
    },
  },
  ({ state: { pool } }) => (
    <>
      <PanelHeader>
        <span>
          <Icon icon='warehouse' color='primary' /> {pool?.name_label}
        </span>
      </PanelHeader>
      <Dashboard />
    </>
  )
)

export default Pool
