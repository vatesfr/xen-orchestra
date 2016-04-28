import _ from 'messages'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
// import { getHostMissingPatches } from 'xo'
import { Row, Col } from 'grid'
import { formatSize } from 'utils'
import { FormattedRelative, FormattedTime } from 'react-intl'

export default ({
  host,
  patches,
  poolPatches
}) => <div>
  <Row>
    { /* TODO: get list of missing patches */ }
    <Col smallSize={12}>
      {!isEmpty(patches)
        ? <span>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>{_('patchNameLabel')}</th>
                <th>{_('patchDescription')}</th>
                <th>{_('patchApplied')}</th>
                <th>{_('patchSize')}</th>
                <th>{_('patchStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {map(patches, (patch) => {
                const poolPatch = poolPatches[patch.pool_patch]
                return <tr key={patch.id}>
                  <td>{poolPatch.name}</td>
                  <td>{poolPatch.description}</td>
                  <td><FormattedTime value={patch.time * 1000} day='numeric' month='long' year='numeric' /> (<FormattedRelative value={patch.time * 1000} />)</td>
                  <td>{formatSize(poolPatch.size)}</td>
                  <td>
                    {patch.applied
                      ? <span className='label label-success'>
                          {_('patchStatusApplied')}
                      </span>
                      : <span className='label label-default'>
                          {_('patchStatusNotApplied')}
                      </span>
                    }
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </span>
        : <h4 className='text-xs-center'>{_('patchesNothing')}</h4>
      }
    </Col>
  </Row>
</div>
