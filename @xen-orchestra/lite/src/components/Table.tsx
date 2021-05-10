import React from 'react'
import styled from 'styled-components'
import { Dictionary, isEmpty, map } from 'lodash'
import { FormattedMessage } from 'react-intl'
import { Map } from 'immutable'
import { withState } from 'reaclette'

type Collections = Dictionary<unknown> | unknown[]

export type TableColumn = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemRenderer: { (item: any): string | JSX.Element }
  name: JSX.Element
}

interface ParentState {}

interface State {}

interface Props {
  collections: Collections | Map<string, unknown> | undefined
  columns: TableColumn[]
}

interface ParentEffects {}

interface Effects {}

interface Computed {
  collections: Collections
}

const _Table = styled.table`
  thead  {
    background-color: #2d83c3;
    color: #fff;
  }
  td,
  th  {
    padding: 1em;
  }
  tbody tr:nth-child(even) {
    background-color: #2d83c324;
  }
  tbody tr:hover {
    background-color: #4749494f;
    transition: 0.4s;
  }
`

const Table = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      collections: (_, props) => {
        const { collections } = props
        if (collections === undefined) {
          return []
        }
        if (Map.isMap(collections)) {
          return collections.toArray().map(item => item[1])
        }
        return collections
      },
    },
  },
  ({ columns, state }) =>
    !isEmpty(state.collections) ? (
      <_Table>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {map(state.collections, (item, index) => (
            <tr key={index}>
              {columns.map((col, index) => (
                <td key={index}>{col.itemRenderer(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </_Table>
    ) : (
      <FormattedMessage id='noData' />
    )
)

export default Table
