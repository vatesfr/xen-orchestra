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
      onSelectItems: (items: Array<any>) => void
      selectedItems: Array<any>
    }
  | {
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
    stateUrlParam: string
  }

interface PropsPagination {
  dataType?: string
  nItemsOnThePage: number
  nSelectedItems?: number
  nTotalItems: number
  nTotalPage: number
  onPaginationChange: (_: any, page: number) => void
  onShowByChange: (value: SelectChangeEvent<unknown>) => void
  page: number
  reverse?: boolean
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

const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: theme.palette.lightGray.main,
  border: 'none',
  color: theme.palette.primary.main,
  height: '24px',
}))

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  border: `1px solid ${theme.palette.lightGray.main}`,
  borderLeft: 'none',
  [`&.${tableCellClasses.head}`]: {
    color: theme.palette.primary.main,
  },
}))

const StyledNbSelectedItems = styled('p')<{ reverse?: boolean }>(({ reverse = false }) => ({
  alignSelf: reverse ? 'flex-end' : 'flex-start',
  fontWeight: 'bold',
}))

const StyledNavButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.lightGray.main,
  color: theme.palette.primary.main,
  borderRadius: '5px',
  margin: '1px',
  padding: 0,
}))

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

const StyledPaginationText = styled('p')(({ theme }) => ({
  color: theme.palette.secondary.main,
  margin: '10px',
}))

function _manageSearchParams({
  searchParams,
  stateUrlParam,
  label,
  value,
}: {
  searchParams: string
  stateUrlParam: string
  label: string
  value: unknown
}) {
  const reg = new RegExp(stateUrlParam + `_${label}=\\d+`)
  if (reg.test(searchParams)) {
    searchParams = searchParams.replace(reg, `${stateUrlParam}_${label}=${value}`)
  } else {
    searchParams += `${searchParams === '' ? '?' : '&'}${stateUrlParam}_${label}=${value}`
  }
  return searchParams
}

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
    nItemsOnThePage,
    nSelectedItems,
    nTotalItems,
    nTotalPage,
    onPaginationChange,
    onShowByChange,
    page,
    reverse,
    showByValue,
  }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: nSelectedItems !== undefined ? 'space-between' : 'right',
      }}
    >
      {nSelectedItems !== undefined && (
        <StyledNbSelectedItems reverse={reverse}>
          <IntlMessage id='itemSelected' values={{ nSelected: nSelectedItems }} />
        </StyledNbSelectedItems>
      )}
      <StyledPaginationContainer>
        <StyledPaginationFlexRow>
          <StyledPaginationText>
            {page * showByValue + 1}-{page * showByValue + nItemsOnThePage} of {nTotalItems}
            {dataType !== undefined && ` ${dataType}`}
          </StyledPaginationText>
          <StyledNavButton size='small' disabled={page === 0} onClick={() => onPaginationChange('', 0)}>
            <SkipPreviousIcon />
          </StyledNavButton>
          <StyledNavButton disabled={page === 0} onClick={() => onPaginationChange('', page - 1)} size='small'>
            <NavigateBeforeIcon />
          </StyledNavButton>
          <StyledNavButton
            disabled={page >= nTotalPage - 1}
            onClick={() => onPaginationChange('', page + 1)}
            size='small'
          >
            <NavigateNextIcon />
          </StyledNavButton>
          <StyledNavButton
            disabled={page >= nTotalPage - 1}
            onClick={() => onPaginationChange('', nTotalPage - 1)}
            size='small'
          >
            <SkipNextIcon />
          </StyledNavButton>
        </StyledPaginationFlexRow>
        <StyledPaginationFlexRow>
          <StyledPaginationText>Show by</StyledPaginationText>
          <StyledSelect
            noNone
            onChange={onShowByChange}
            optionRenderer={item => item}
            options={[10, 25, 50, 100]}
            required
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
      // URL Can contains theses following search params:
      // {props.stateUrlParam}_page={number}: Its value is the requested page of the table.
      // {props.stateUrlParam}_row={number}: Its determine how many items per page we want to display.
      handlePaginationChange: function (_, page) {
        const searchParams = _manageSearchParams({
          searchParams: this.props.location.search,
          stateUrlParam: this.props.stateUrlParam,
          label: 'page',
          value: page,
        })
        this.props.history.push(`${this.props.location.pathname}${searchParams}`)
      },
      handleRowPerPage: function (e) {
        const searchParams = _manageSearchParams({
          searchParams: this.props.location.search,
          stateUrlParam: this.props.stateUrlParam,
          label: 'row',
          value: e.target.value,
        })
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
      rowsPerPage: (_, { location, stateUrlParam }) =>
        Number(location.search.match(new RegExp(stateUrlParam + '_row=\\d+'))?.[0]?.split('=')[1] ?? 10),
    },
  },
  ({
    collection,
    columns,
    dataType,
    effects,
    onSelectItems,
    selectedItems,
    state: { page, paginatedCollection, rowsPerPage },
  }) =>
    paginatedCollection !== undefined && collection !== undefined ? (
      <>
        <Pagination
          dataType={dataType}
          nItemsOnThePage={paginatedCollection.length}
          nSelectedItems={selectedItems?.length}
          nTotalItems={collection.length}
          nTotalPage={Math.ceil(collection.length / rowsPerPage)}
          onPaginationChange={effects.handlePaginationChange}
          onShowByChange={effects.handleRowPerPage}
          page={page}
          reverse
          showByValue={rowsPerPage}
        />
        <MUITable>
          <TableHead>
            <TableRow>
              {onSelectItems !== undefined && (
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
                {onSelectItems !== undefined && (
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
          nItemsOnThePage={paginatedCollection.length}
          nSelectedItems={selectedItems?.length}
          nTotalItems={collection.length}
          nTotalPage={Math.ceil(collection.length / rowsPerPage)}
          onPaginationChange={effects.handlePaginationChange}
          onShowByChange={effects.handleRowPerPage}
          page={page}
          showByValue={rowsPerPage}
        />
      </>
    ) : (
      <IntlMessage id='loading' />
    )
)

export default withRouter(Table)
