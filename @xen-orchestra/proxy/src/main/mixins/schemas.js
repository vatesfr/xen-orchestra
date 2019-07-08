import Ajv from 'ajv'

export default class Schemas {
  constructor() {
    const ajv = new Ajv({
      useDefaults: true,
      strictDefaults: true,
    })
    this.compile = ajv.compile.bind(ajv)
  }
}
