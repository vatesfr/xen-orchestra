import Collapse from 'collapse'
import Component from 'base-component'
import React from 'react'
import { map } from 'lodash'

import _ from '../../intl'
import propTypes from '../../prop-types-decorator'
import SingleLineRow from '../../single-line-row'
import { SelectSr } from '../../select-objects'
import { isSrWritable } from 'xo'
import { Container, Col } from 'grid'

const Collapsible = ({ collapsible, children, ...props }) =>
  collapsible ? (
    <Collapse {...props}>{children}</Collapse>
  ) : (
    <div>
      <span>{props.buttonText}</span>
      <br />
      {children}
    </div>
  )

Collapsible.propTypes = {
  collapsible: propTypes.bool.isRequired,
  children: propTypes.node.isRequired,
}

@propTypes({
  mainSr: propTypes.string.isRequired,
  mainSrPredicate: propTypes.func,
  mapVdisSrs: propTypes.object.isRequired,
  onChange: propTypes.func.isRequired,
  srPredicate: propTypes.func,
  vdis: propTypes.array.isRequired
})
export default class ChooseSrForEachVdisModal extends Component {
  render () {
    const { props } = this
    const {
      mainSr,
      mainSrPredicate = isSrWritable,
      mapVdisSrs,
      onChange,
      srPredicate = mainSrPredicate,
      vdis
    } = props

    return <div>
      <SelectSr
        onChange={mainSr => onChange({mainSr})}
        predicate={mainSrPredicate}
        placeholder={_('chooseSrForEachVdisModalMainSr')}
        value={mainSr}
      />
      <br />
      {vdis != null && mainSr != null &&
        <Collapsible collapsible={vdis.length >= 3} buttonText={_('chooseSrForEachVdisModalSelectSr')}>
          <br />
          <Container>
            <SingleLineRow>
              <Col size={6}><strong>{_('chooseSrForEachVdisModalVdiLabel')}</strong></Col>
              <Col size={6}><strong>{_('chooseSrForEachVdisModalSrLabel')}</strong></Col>
            </SingleLineRow>
            {map(vdis, vdi =>
              <SingleLineRow key={vdi.uuid}>
                <Col size={6}>{ vdi.name_label || vdi.name }</Col>
                <Col size={6}>
                  <SelectSr
                    onChange={sr => onChange({ mapVdisSrs: { ...mapVdisSrs, [vdi.uuid]: sr } })}
                    value={mapVdisSrs[vdi.uuid]}
                    predicate={srPredicate}
                  />
                </Col>
              </SingleLineRow>
            )}
            <i>{_('chooseSrForEachVdisModalOptionalEntry')}</i>
          </Container>
        </Collapsible>
      }
    </div>
  }
}
