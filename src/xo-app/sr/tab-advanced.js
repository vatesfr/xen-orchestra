import _ from 'intl'
import Component from 'base-component'
import Copiable from 'copiable'
import React from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import { formatSize } from 'utils'
import { createSelector } from 'selectors'
import { deleteSr, getUnheathlyChains } from 'xo'
import { Container, Row, Col } from 'grid'

// ===================================================================

const COLUMNS = [
  {
    name: _('srUnHealthyVdiNameLabel'),
    itemRenderer: vdi => <span>{vdi.name_label}</span>,
    sortCriteria: vdi => vdi.name_label
  },
  {
    name: _('srUnHealthyVdiSize'),
    itemRenderer: vdi => formatSize(vdi.size),
    sortCriteria: vdi => vdi.size
  },
  {
    name: _('srUnHealthyVdiDepth'),
    itemRenderer: vdi => vdi.depth,
    sortCriteria: vdi => vdi.depth
  }
]

class UnHealthyVdiChains extends Component {
  _getUnHealthyVdiChains = createSelector(
    () => this.props.sr,
    async sr => {
      const chains = await getUnheathlyChains(sr)
      this.setState({
        chains
      })
    }
  )

  render () {
    const { chains } = this.state
    this._getUnHealthyVdiChains()

    return chains && chains.length !== 0
      ? <div>
        <h3>{_('srUnHealthyVdiTitle')}</h3>
        <SortedTable
          collection={this.state.chains}
          columns={COLUMNS}
        />
      </div>
      : <span />
  }
}

export default ({
  sr
}) => {
  return <Container>
    <Row>
      <Col className='text-xs-right'>
        <TabButton
          btnStyle='danger'
          handler={deleteSr}
          handlerParam={sr}
          icon='sr-remove'
          labelId='srRemoveButton'
        />
      </Col>
    </Row>
    <Row>
      <Col>
        <h3>{_('xenSettingsLabel')}</h3>
        <table className='table'>
          <tbody>
            <tr>
              <th>{_('uuid')}</th>
              <Copiable tagName='td'>
                {sr.uuid}
              </Copiable>
            </tr>
          </tbody>
        </table>
      </Col>
    </Row>
    <Row>
      <Col>
        <UnHealthyVdiChains sr={sr} />
      </Col>
    </Row>
  </Container>
}
