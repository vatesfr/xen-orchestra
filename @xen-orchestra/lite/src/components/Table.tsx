import React from 'react'
import styled from 'styled-components'
import { Dictionary, isEmpty, map } from 'lodash'
import { FormattedMessage } from 'react-intl'
import { Map } from 'immutable'
import { withState } from 'reaclette'

import intlMessage from '../lang/en.json'

type Collection = Dictionary<unknown> | unknown[]

export type Column<Type> = {
  messageId: keyof typeof intlMessage
  render: {(item: Type): string | JSX.Element}
}

interface ParentState {}

interface State {}

interface Props {
  collection: Collection | Map<string, unknown> | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: Column<any>[]
}

interface ParentEffects {}

interface Effects {}

interface Computed {
  collection: Collection
}

const StyledTable = styled.table`
  border: 1px solid #333;
  td {
    border: 1px solid #333;
  }
  thead {
    background-color: #333;
    color: #fff;
  }
`
const Table = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      collection: (_, { collection }) => {
        if (collection === undefined) {
          return []
        }
        if (Map.isMap(collection)) {
          return collection.toArray().map(item => item[1])
        }
        return collection
      },
    },
  },
  ({ columns, state }) =>
    !isEmpty(state.collection) ? (
      <StyledTable>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <td key={index}>
                <FormattedMessage id={col.messageId} />
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {map(state.collection, (item, index) => (
            // @ts-expect-error object-is-of-type-unknown
            <tr key={item.$id ?? index}>
              {columns.map((col, index) => (
                <td key={index}>{col.render(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </StyledTable>
    ) : (
      <FormattedMessage id='noData' />
    )
)

export default Table
