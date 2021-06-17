import React from 'react'
import styled from 'styled-components'
import { FormattedMessage } from 'react-intl'
import { withState } from 'reaclette'

export type Column<Type> = {
  header: React.ReactNode
  id?: string | number
  render: { (item: Type): string | JSX.Element }
}

export type Item<T> = T & {
  id?: string
}

interface ParentState {}

interface State {}

interface Props {
  collection: Item<unknown>[] | undefined
  columns: Column<any>[]
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
const Table = withState<State, Props, Effects, Computed, ParentState, ParentEffects>({}, ({ collection, columns }) =>
  collection !== undefined && collection.length !== 0 ? (
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
    <FormattedMessage id='noData' />
  )
)

export default Table
