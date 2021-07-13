import React from 'react'
import styled from 'styled-components'
import { withState } from 'reaclette'

import IntlMessage from './IntlMessage'

export type Column<Type> = {
  header: React.ReactNode
  id?: string
  render: { (item: Type): React.ReactNode }
}

type Item = {
  id?: string
  [key: string]: any
}

interface ParentState {}

interface State {}

interface Props {
  collection: Item[] | undefined
  columns: Column<any>[]
  placeholder?: JSX.Element
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

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
const Table = withState<State, Props, Effects, Computed, ParentState, ParentEffects>({}, ({ collection, columns, placeholder }) =>
  collection !== undefined ? (
    collection.length !== 0 ? (
      <StyledTable>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <td key={col.id ?? index}>{col.header}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {collection.map((item, index) => (
            <tr key={item.id ?? index}>
              {columns.map((col, index) => (
                <td key={col.id ?? index}>{col.render(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </StyledTable>
    ) : (
      placeholder ?? <IntlMessage id='noData' />
    )
  ) : (
    <IntlMessage id='loading' />
  )
)

export default Table
