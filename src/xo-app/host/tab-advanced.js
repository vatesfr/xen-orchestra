import React from 'react'

import { Debug } from 'utils'

export default ({
  controllerVm,
  host
}) => <div><Debug value={host} /><Debug value={controllerVm} /></div>
