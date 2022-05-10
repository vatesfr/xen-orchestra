import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import React from 'react'
import SkipNextIcon from '@mui/icons-material/SkipNext'
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious'
import {
  Box,
  IconButton,
  styled,
  Table as MUITable,
  TableCell,
  tableCellClasses,
  TableHead,
  TableRow,
  TableBody,
  SelectChangeEvent,
} from '@mui/material'
import { findIndex } from 'lodash'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { withState } from 'reaclette'

import Checkbox from './Checkbox'
import IntlMessage from './IntlMessage'
import Select from './Select'
import Icon, { IconName } from './Icon'

export type Column<Type> = {
  center?: boolean
  header?: React.ReactNode
  icon?: IconName
  id?: string
  isNumeric?: boolean
  render: { (item: Type): React.ReactNode } | string
}

type IsSelectable =
  | {
      isItemSelectable: true
      onSelectItems: (items: Array<any>) => void
      selectedItems: Array<any>
    }
  | {
      isItemSelectable?: false
      onSelectItems?: never
      selectedItems?: never
    }

type Item = {
  id?: string
  [key: string]: any
}

interface ParentState {}

interface State {}

interface StatePagination {}

type Props = IsSelectable &
  RouteComponentProps & {
    collection: Item[] | undefined
    columns: Column<any>[]
    dataType?: string
    placeholder?: JSX.Element
    rowPerPages?: number
    rowsPerPageOptions?: number[]
    stateUrlParam: string
  }

interface PropsPagination {
  dataType?: string
  nbItemsOnThePage: number
  nbSelectedItems?: number
  nbTotalItems: number
  nbTotalPage: number
  onPaginationChange: (_: any, page: number) => void
  onShowByChange: (value: SelectChangeEvent<unknown>) => void
  page: number
  reverse?: boolean
  rowPerPageOptions?: Array<number>
  showByValue: number
}

interface ParentEffects {}

interface Effects {
  handlePaginationChange: (e: any, page: number) => void
  handleRowPerPage: (e: any) => void
  toggleAllSelectedItem: () => void
  toggleSelectItem: (item: any) => void
}
interface EffectsPagination {}

interface Computed {
  page: number
  paginatedCollection: Props['collection']
  rowsPerPage: number
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
  alignSelf: reverse ? 'flex-end' : 'flex-start',
  fontWeight: 'bold',
}))

const StyledNavButton = styled(IconButton)({
  backgroundColor: '#E8E8E8',
  borderRadius: '5px',
  margin: '1px',
  padding: 0,
})

const StyledPaginationContainer = styled(Box)({
  alignItems: 'flex-end',
  display: 'flex',
  flexDirection: 'column',
  fontSize: '13px',
})

const StyledPaginationFlexRow = styled(Box)({
  alignItems: 'center',
  display: 'inline-flex',
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
    dataType,
    nbItemsOnThePage,
    nbSelectedItems,
    nbTotalItems,
    nbTotalPage,
    onPaginationChange,
    onShowByChange,
    page,
    reverse,
    rowPerPageOptions = [10, 25, 50, 100],
    showByValue,
  }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: nbSelectedItems !== undefined ? 'space-between' : 'right',
      }}
    >
      {nbSelectedItems !== undefined && (
        <StyledNbSelectedItems reverse={reverse}>
          <IntlMessage id='itemSelected' values={{ nSelected: nbSelectedItems }} />
        </StyledNbSelectedItems>
      )}
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
            color='primary'
            disabled={page === 0}
            onClick={() => onPaginationChange('', page - 1)}
            size='small'
          >
            <NavigateBeforeIcon />
          </StyledNavButton>
          <StyledNavButton
            color='primary'
            disabled={page >= nbTotalPage - 1}
            onClick={() => onPaginationChange('', page + 1)}
            size='small'
          >
            <NavigateNextIcon />
          </StyledNavButton>
          <StyledNavButton
            color='primary'
            disabled={page >= nbTotalPage - 1}
            onClick={() => onPaginationChange('', nbTotalPage - 1)}
            size='small'
          >
            <SkipNextIcon />
          </StyledNavButton>
        </StyledPaginationFlexRow>
        <StyledPaginationFlexRow>
          <StyledPaginationText>Show by</StyledPaginationText>
          <Select
            color='primary'
            noNone
            onChange={onShowByChange}
            optionRenderer={item => item}
            options={rowPerPageOptions}
            required
            sx={{
              backgroundColor: '#E8E8E8',
              border: 'none',
              color: '#007bff',
              height: '24px',
            }}
            value={showByValue}
            valueRenderer={item => item}
          />
        </StyledPaginationFlexRow>
      </StyledPaginationContainer>
    </Box>
  )
)

const Table = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    effects: {
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
      toggleAllSelectedItem: function () {
        if (this.props.collection === undefined) {
          return
        }
        this.props.onSelectItems?.(
          this.props.selectedItems.length !== this.props.collection.length ? this.props.collection : []
        )
      },
      toggleSelectItem: function (item: any) {
        const { selectedItems } = this.props
        if (selectedItems === undefined) {
          return
        }
        const index = findIndex(selectedItems, item)
        index === -1 ? selectedItems.push(item) : selectedItems.splice(index, 1)
        this.props.onSelectItems(selectedItems)
      },
    },
    computed: {
      page: (_, { location, stateUrlParam }) =>
        Number(location.search.match(new RegExp(stateUrlParam + '_page=\\d+'))?.[0]?.split('=')[1] ?? 0),
      paginatedCollection: ({ page, rowsPerPage }, { collection }) =>
        collection?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
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
    dataType,
    effects,
    isItemSelectable,
    rowsPerPageOptions,
    selectedItems,
    state: { page, paginatedCollection, rowsPerPage },
  }) =>
    paginatedCollection !== undefined && collection !== undefined ? (
      <>
        <Pagination
          dataType={dataType}
          nbItemsOnThePage={paginatedCollection.length}
          nbSelectedItems={selectedItems?.length}
          nbTotalItems={collection.length}
          nbTotalPage={Math.ceil(collection.length / rowsPerPage)}
          onPaginationChange={effects.handlePaginationChange}
          onShowByChange={effects.handleRowPerPage}
          page={page}
          reverse
          rowPerPageOptions={rowsPerPageOptions}
          showByValue={rowsPerPage}
        />
        <MUITable>
          <TableHead>
            <TableRow>
              {isItemSelectable && (
                <StyledTableCell padding='checkbox'>
                  <Checkbox
                    checked={selectedItems.length > 0 && selectedItems.length === collection.length}
                    color='primary'
                    indeterminate={selectedItems.length > 0 && selectedItems.length < collection.length}
                    onChange={effects.toggleAllSelectedItem}
                  />
                </StyledTableCell>
              )}
              {columns.map((col, index) => (
                <StyledTableCell key={col.id ?? index} align={col.center ? 'center' : 'left'}>
                  {col.icon !== undefined && <Icon icon={col.icon} />}{' '}
                  {typeof col.header === 'string' ? col.header.toUpperCase() : col.header}
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
                    {typeof col.render === 'function' ? col.render(item) : col.render}
                  </StyledTableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </MUITable>
        <Pagination
          dataType={dataType}
          nbItemsOnThePage={paginatedCollection.length}
          nbSelectedItems={selectedItems?.length}
          nbTotalItems={collection.length}
          nbTotalPage={Math.ceil(collection.length / rowsPerPage)}
          onPaginationChange={effects.handlePaginationChange}
          onShowByChange={effects.handleRowPerPage}
          page={page}
          rowPerPageOptions={rowsPerPageOptions}
          showByValue={rowsPerPage}
        />
      </>
    ) : (
      <IntlMessage id='loading' />
    )
)

export default withRouter(Table)
