import React from 'react'

import propTypes from '../prop-types-decorator'

const Null = () => null

export const Column = propTypes(Null)({
  component: propTypes.func,
  default: propTypes.bool,
  name: propTypes.node,
  itemRenderer: propTypes.func,
  sortCriteria: propTypes.oneOfType([propTypes.func, propTypes.string]),
  sortOrder: propTypes.string,
  textAlign: propTypes.string,
})
export const SortedTable = Null

export const render = ({ vdis }) => (
  <div>
    <SortedTable collection={vdis}>
      <Column name='Nom du VDI' sortCriteria='name_label' />
    </SortedTable>
  </div>
)
