import React from 'react'
import Component from 'base-component'
import SortedTable from 'sorted-table'
import { FormattedDate } from 'react-intl'

const COLUMNS = [
  {
    default: true,
    name: 'Date',
    itemRenderer: ({ date }) => (
      <FormattedDate
        value={new Date(date)}
        month='long'
        day='numeric'
        year='numeric'
        hour='2-digit'
        minute='2-digit'
        second='2-digit'
      />
    ),
    sortCriteria: 'date',
    sortOrder: 'desc',
  },
  {
    name: 'Content',
    itemRenderer: ({ content }) => content,
  },
]

const collection = [
  {
    date: 1536242182676,
    content: 'Hey there!',
  },
]

export default class Notifications extends Component {
  render () {
    return (
      <SortedTable
        columns={COLUMNS}
        collection={collection}
        stateUrlParam='s'
      />
    )
  }
}
