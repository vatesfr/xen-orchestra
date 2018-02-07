/* eslint-env jest */

import React from 'react'
import { forEach } from 'lodash'
import { shallow } from 'enzyme'

import * as grid from './grid'

forEach(grid, (Component, name) => {
  it(name, () => {
    expect(shallow(<Component />)).toMatchSnapshot()
  })
})
