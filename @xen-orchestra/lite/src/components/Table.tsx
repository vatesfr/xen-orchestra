import React from 'react'
import { withState } from 'reaclette'

import IntlMessage from './IntlMessage'
import {
  styled,
  Table as MUITable,
  TableCell,
  tableCellClasses,
  TableHead,
  TableRow,
  TableSortLabel,
  TableBody,
  TablePagination,
  Box,
  IconButton,
} from '@mui/material'
import Checkbox from './Checkbox'
import { findIndex } from 'lodash'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { cpuUsage } from 'process'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious'
import Select from './Select'

export type Column<Type> = {
  header: React.ReactNode
  id?: string
  render: { (item: Type): React.ReactNode }
  isNumeric?: boolean
}

type Item = {
  id?: string
  [key: string]: any
}

interface ParentState {}

interface State {
  selectedItems: Array<unknown>
}

interface Props extends RouteComponentProps {
  collection: Item[] | undefined
  columns: Column<any>[]
  dataType?: string
  placeholder?: JSX.Element
  isItemSelectable?: boolean
  rowPerPages?: number
  stateUrlParam: string
  rowsPerPageOptions?: number[]
}

interface ParentEffects {}

interface Effects {
  toggleSelectItem: (item: any) => void
  toggleAllSelectedItem: () => void
  handlePaginationChange: (e: any, page: number) => void
  handleRowPerPage: (e: any) => void
}

interface Computed {
  nbSelectedItems: JSX.Element
  page: number
  rowsPerPage: number
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  border: '1px solid #E8E8E8',
  borderLeft: 'none',
  [`&.${tableCellClasses.head}`]: {
    color: theme.palette.primary.main,
  },
}))

const StyledNbSelectedItems = styled('p')({
  fontWeight: 'bold',
})

const StyledNavButton = styled(IconButton)({
  backgroundColor: '#E8E8E8',
  borderRadius: '5px',
  padding: 0,
  margin: '1px',
})

interface IPagination {
  nbSelectedItems: number
  dataType?: string
}
const Pagination = ({ dataType, nbSelectedItems }: IPagination) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      {nbSelectedItems}
      {/* Table pagination have to be customized */}
      <div
        style={{
          fontSize: '13px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <p
            style={{
              color: '#585757',
            }}
          >
            1-50 of 512{dataType !== undefined && ` ${dataType}`}
          </p>
          <StyledNavButton color='primary' size='small' disabled>
            <SkipPreviousIcon />
          </StyledNavButton>
          <StyledNavButton disabled color='primary' size='small'>
            <NavigateBeforeIcon />
          </StyledNavButton>
          <StyledNavButton color='primary' size='small'>
            <NavigateNextIcon />
          </StyledNavButton>
          <StyledNavButton color='primary' size='small'>
            <SkipNextIcon color='primary' />
          </StyledNavButton>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <p
            style={{
              margin: '10px',
            }}
          >
            Show by
          </p>
          <Select
            onChange={() => {}}
            color='primary'
            options={[10, 25, 50, 100]}
            required
            value={10}
            valueRenderer={item => item}
            optionRenderer={item => item}
            noNone
            sx={{
              backgroundColor: '#E8E8E8',
              height: '24px',
              color: '#007bff',
              border: 'none',
            }}
          />
        </div>
      </div>
      {/* In order to follow the model
    <TablePagination
      component='div'
      sx={{
        display: 'block',
      }}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={rowsPerPageOptions}
      onRowsPerPageChange={effects.handleRowPerPage}
      count={collection.length}
      page={page}
      onPageChange={effects.handlePaginationChange}
      labelRowsPerPage='Show by'
      // labelDisplayedRows={() => 'toto'}
      // datatype="VM"

    /> */}
    </Box>
  )
}

const Table = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      selectedItems: [
        {
          name: 'Mathieu Foo',
          description: 'Foo',
          host_name: 'Host Foo',
          pool_name: 'Pool Foo',
          ipv4: '172.16.210.11',
          cpu: 1,
          ram: 4,
          sr_name: 'SR Foo',
          snapshot_name: 'Snapshot Foo',
        },
      ],
    }),
    effects: {
      toggleSelectItem: function (item: any) {
        const { selectedItems } = this.state
        const index = findIndex(selectedItems, item)
        index === -1 ? selectedItems.push(item) : selectedItems.splice(index, 1)
        this.state.selectedItems = [...selectedItems]
      },
      toggleAllSelectedItem: function () {
        if (this.props.collection === undefined) {
          return
        }
        this.state.selectedItems.length !== this.props.collection.length
          ? (this.state.selectedItems = [...this.props.collection])
          : (this.state.selectedItems = [])
      },
      handlePaginationChange: function (_, page) {
        const reg = new RegExp(this.props.stateUrlParam + '_page=\\d+')
        let searchParams = this.props.location.search
        if (reg.test(searchParams)) {
          searchParams = searchParams.replace(reg, `${this.props.stateUrlParam}_page=${page}`)
        } else {
          searchParams += `?${this.props.stateUrlParam}_page=${page}`
        }
        this.props.history.push(`${this.props.location.pathname}${searchParams}`)
      },
      handleRowPerPage: function (e) {
        const reg = new RegExp(this.props.stateUrlParam + '_row=\\d+')
        let searchParams = this.props.location.search
        if (reg.test(searchParams)) {
          searchParams = searchParams.replace(reg, `${this.props.stateUrlParam}_row=${e.target.value}`)
        } else {
          searchParams += `?${this.props.stateUrlParam}_row=${e.target.value}`
        }
        this.props.history.push(`${this.props.location.pathname}${searchParams}`)
      },
    },
    computed: {
      nbSelectedItems: ({ selectedItems }: State) => (
        <StyledNbSelectedItems>
          <IntlMessage id='itemSelected' values={{ nSelected: selectedItems.length }} />
        </StyledNbSelectedItems>
      ),
      page: (_, { location, stateUrlParam }) =>
        Number(location.search.match(new RegExp(stateUrlParam + '_page=\\d+'))?.[0]?.split('=')[1] ?? 0),
      rowsPerPage: (_, { location, stateUrlParam, rowsPerPageOptions }) => {
        const _rowsPerPageOptions = rowsPerPageOptions ?? [10, 25, 50, 100]
        let rowsPerPage = Number(
          location.search.match(new RegExp(stateUrlParam + '_row=\\d+'))?.[0]?.split('=')[1] ?? _rowsPerPageOptions[0]
        )
        if (!_rowsPerPageOptions.includes(rowsPerPage)) {
          console.error('Not allowed rowsPerPage', rowsPerPage)
          rowsPerPage = _rowsPerPageOptions[0]
        }
        return rowsPerPage
      },
    },
  },
  ({
    collection,
    columns,
    placeholder,
    effects,
    state: { selectedItems, nbSelectedItems, page, rowsPerPage },
    isItemSelectable,
    rowsPerPageOptions,
    dataType,
  }) =>
    collection !== undefined ? (
      <>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {nbSelectedItems}
          <TablePagination
            component='div'
            sx={{
              display: 'block',
            }}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={rowsPerPageOptions}
            onRowsPerPageChange={effects.handleRowPerPage}
            count={collection.length}
            page={page}
            onPageChange={effects.handlePaginationChange}
            labelRowsPerPage='Show by'
          />
        </Box>
        <MUITable>
          <TableHead>
            <TableRow>
              {isItemSelectable && (
                <StyledTableCell padding='checkbox'>
                  <Checkbox
                    color='primary'
                    indeterminate={selectedItems.length > 0 && selectedItems.length < collection.length}
                    checked={selectedItems.length > 0 && selectedItems.length === collection.length}
                    onChange={effects.toggleAllSelectedItem}
                  />
                </StyledTableCell>
              )}
              {columns.map((col, index) => (
                <StyledTableCell key={col.id ?? index}>{col.header}</StyledTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {collection.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item, index) => (
              <TableRow key={item.id ?? index}>
                {isItemSelectable && (
                  <StyledTableCell padding='checkbox'>
                    <Checkbox
                      onChange={() => effects.toggleSelectItem(item)}
                      checked={findIndex(selectedItems, item) !== -1}
                    />
                  </StyledTableCell>
                )}
                {columns.map((col, i) => (
                  <StyledTableCell key={col.id ?? i} align={col.isNumeric ? 'right' : 'left'}>
                    {col.render(item)}
                  </StyledTableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </MUITable>
      </>
    ) : (
      <IntlMessage id='loading' />
    )
)

export default withRouter(Table)
