import React from 'react'
import styled from 'styled-components'
import { Dictionary, isEmpty, map } from 'lodash'
import { FormattedMessage } from 'react-intl'
import { Map } from 'immutable'
import { withState } from 'reaclette'

import intlMessage from '../lang/en.json'

type Collections = Dictionary<unknown> | unknown[]

export type Column<Type> = {
  formattedMessageId: keyof typeof intlMessage
  propertyToDisplay: keyof Type
}

interface ParentState {}

interface State {}

interface Props {
  collections: Collections | Map<string, unknown> | undefined
  columns: Column<never>[]
}

interface ParentEffects {}

interface Effects {}

interface Computed {
  collections: Collections
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
      collections: (_, { collections }) => {
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
      <StyledTable>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <td key={index}>
                <FormattedMessage id={col.formattedMessageId} />
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {map(state.collections, (item, index) => (
            <tr key={index}>
              {columns.map((col, index) => (
                // @ts-expect-error object-type-unknown
                <td key={index}>{item[col.propertyToDisplay]}</td>
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
