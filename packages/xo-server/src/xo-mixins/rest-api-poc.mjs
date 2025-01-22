import setupRestApi from '@xen-orchestra/rest-api'

export default class ClassRestApiPoc {
  constructor(app, { express }) {
    if (express === undefined) {
      return
    }

    setupRestApi(express, app)
  }
}
