import _ from 'intl'
import Copiable from 'copiable'
import React from 'react'

export default ({ vmGroup }) => {
  return (
    <div>
      <h3>{_('xenSettingsLabel')}</h3>
      { vmGroup &&
        <table className='table'>
          <tbody>
            <tr>
              <th>{_('uuid')}</th>
              <Copiable tagName='td'>
                {vmGroup.id}
              </Copiable>
            </tr>
          </tbody>
        </table>
      }
    </div>
  )
}
