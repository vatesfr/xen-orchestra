import PropTypes from 'prop-types'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconName, library } from '@fortawesome/fontawesome-svg-core'
import { faCoffee } from '@fortawesome/free-solid-svg-icons'

library.add(faCoffee)

const Icon = ({ icon }: { icon: IconName }): JSX.Element => (
  <FontAwesomeIcon icon={icon} />
)

Icon.propTypes = {
  icon: PropTypes.string.isRequired
}

export default Icon
