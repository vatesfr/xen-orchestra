import _ from 'intl'
import Component from 'base-component'
import React from 'react'
import { Container } from 'grid'
import { Toggle } from 'form'

import XvaImport from './xva-import'
import UrlImport from './url-import'

// ===================================================================

const RENDER_BY_TYPE = {
  xva: <XvaImport />,
  url: <UrlImport />,
}

export default class Import extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isFromUrl: false,
    }
  }

  render() {
    const { isFromUrl } = this.state

    return (
      <Container>
        <form id='import-form'>
          <p>
            <Toggle value={isFromUrl} onChange={this.toggleState('isFromUrl')} /> {_('fromUrl')}
          </p>
          {RENDER_BY_TYPE[isFromUrl ? 'url' : 'xva']}
        </form>
      </Container>
    )
  }
}
