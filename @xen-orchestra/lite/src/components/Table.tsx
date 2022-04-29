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
  SelectChangeEvent,
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
  center?: boolean
}

type Item = {
  id?: string
  [key: string]: any
}

interface ParentState {}

interface State {
  selectedItems: Array<unknown>
}

interface StatePagination {}

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

interface PropsPagination {
  rowPerPageOptions?: Array<number>
  nbSelectedItems: number
  nbTotalItems: number
  dataType?: string
  reverse?: boolean
  onPaginationChange: (_: any, page: number) => void
  onShowByChange: (value: SelectChangeEvent<unknown>) => void
  showByValue: number
  page: number
  nbTotalPage: number
  nbItemsOnThePage: number
}

interface ParentEffects {}

interface Effects {
  toggleSelectItem: (item: any) => void
  toggleAllSelectedItem: () => void
  handlePaginationChange: (e: any, page: number) => void
  handleRowPerPage: (e: any) => void
}
interface EffectsPagination {}

interface Computed {
  page: number
  rowsPerPage: number
  paginatedCollection: Props['collection']
}

interface ComputedPagination {}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  border: '1px solid #E8E8E8',
  borderLeft: 'none',
  [`&.${tableCellClasses.head}`]: {
    color: theme.palette.primary.main,
  },
}))

const StyledNbSelectedItems = styled('p')<{ reverse?: boolean }>(({ reverse = false }) => ({
  fontWeight: 'bold',
  alignSelf: reverse ? 'flex-end' : 'flex-start',
}))

const StyledNavButton = styled(IconButton)({
  backgroundColor: '#E8E8E8',
  borderRadius: '5px',
  padding: 0,
  margin: '1px',
})

const StyledPaginationContainer = styled(Box)({
  fontSize: '13px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
})

const StyledPaginationFlexRow = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
})

const StyledPaginationText = styled('p')({
  color: '#585757',
  margin: '10px',
})

const Pagination = withState<
  StatePagination,
  PropsPagination,
  EffectsPagination,
  ComputedPagination,
  ParentState,
  ParentEffects
>(
  {},
  ({
    rowPerPageOptions = [10, 25, 50, 100],
    nbItemsOnThePage,
    nbTotalPage,
    page,
    dataType,
    nbSelectedItems,
    reverse,
    nbTotalItems,
    showByValue,
    onShowByChange,
    onPaginationChange,
  }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <StyledNbSelectedItems reverse={reverse}>
        <IntlMessage id='itemSelected' values={{ nSelected: nbSelectedItems }} />
      </StyledNbSelectedItems>
      <StyledPaginationContainer>
        <StyledPaginationFlexRow>
          <StyledPaginationText>
            {page * showByValue + 1}-{page * showByValue + nbItemsOnThePage} of {nbTotalItems}
            {dataType !== undefined && ` ${dataType}`}
          </StyledPaginationText>
          <StyledNavButton color='primary' size='small' disabled={page === 0} onClick={() => onPaginationChange('', 0)}>
            <SkipPreviousIcon />
          </StyledNavButton>
          <StyledNavButton
            disabled={page === 0}
            color='primary'
            size='small'
            onClick={() => onPaginationChange('', page - 1)}
          >
            <NavigateBeforeIcon />
          </StyledNavButton>
          <StyledNavButton
            color='primary'
            size='small'
            disabled={page >= nbTotalPage - 1}
            onClick={() => onPaginationChange('', page + 1)}
          >
            <NavigateNextIcon />
          </StyledNavButton>
          <StyledNavButton
            color='primary'
            size='small'
            disabled={page >= nbTotalPage - 1}
            onClick={() => onPaginationChange('', nbTotalPage - 1)}
          >
            <SkipNextIcon />
          </StyledNavButton>
        </StyledPaginationFlexRow>
        <StyledPaginationFlexRow>
          <StyledPaginationText>Show by</StyledPaginationText>
          <Select
            onChange={onShowByChange}
            color='primary'
            options={rowPerPageOptions}
            required
            value={showByValue}
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
        </StyledPaginationFlexRow>
      </StyledPaginationContainer>
    </Box>
  )
)

const Table = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      selectedItems: [],
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
      paginatedCollection: ({ page, rowsPerPage }, { collection }) =>
        collection?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    },
  },
  ({
    collection,
    columns,
    placeholder,
    effects,
    state: { selectedItems, page, rowsPerPage, paginatedCollection },
    isItemSelectable,
    rowsPerPageOptions,
    dataType,
  }) =>
    paginatedCollection !== undefined && collection !== undefined ? (
      <>
        <Pagination
          rowPerPageOptions={rowsPerPageOptions}
          nbSelectedItems={selectedItems.length}
          nbTotalItems={collection.length}
          dataType={dataType}
          reverse
          showByValue={rowsPerPage}
          onPaginationChange={effects.handlePaginationChange}
          onShowByChange={effects.handleRowPerPage}
          page={page}
          nbTotalPage={Math.ceil(collection.length / rowsPerPage)}
          nbItemsOnThePage={paginatedCollection.length}
        />
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
                <StyledTableCell key={col.id ?? index} align={col.center ? 'center' : 'left'}>
                  {col.header}
                </StyledTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCollection?.map((item, index) => (
              <TableRow key={item.id ?? item.$id ?? index}>
                {isItemSelectable && (
                  <StyledTableCell padding='checkbox'>
                    <Checkbox
                      onChange={() => effects.toggleSelectItem(item)}
                      checked={findIndex(selectedItems, item) !== -1}
                    />
                  </StyledTableCell>
                )}
                {columns.map((col, i) => (
                  <StyledTableCell key={col.id ?? i} align={col.center ? 'center' : col.isNumeric ? 'right' : 'left'}>
                    {col.render(item)}
                  </StyledTableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </MUITable>
        <Pagination
          rowPerPageOptions={rowsPerPageOptions}
          nbSelectedItems={selectedItems.length}
          nbTotalItems={collection.length}
          dataType={dataType}
          showByValue={rowsPerPage}
          onPaginationChange={effects.handlePaginationChange}
          onShowByChange={effects.handleRowPerPage}
          page={page}
          nbTotalPage={Math.ceil(collection.length / rowsPerPage)}
          nbItemsOnThePage={paginatedCollection.length}
        />
      </>
    ) : (
      <IntlMessage id='loading' />
    )
)

export default withRouter(Table)
