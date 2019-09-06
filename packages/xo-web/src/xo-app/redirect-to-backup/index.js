import React from 'react'
import { Redirect } from 'react-router'
import { routes } from 'utils'

const RedirectToBackup = routes('overview', {})(() => <Redirect to='/backup' />)

export default RedirectToBackup
