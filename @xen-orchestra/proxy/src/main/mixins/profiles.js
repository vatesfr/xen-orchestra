export default class Profiles {
  constructor(app) {
    const profiles = app.db.createTable('profiles', {
      name: {
        type: 'string',
        // primaryKey: true,
      },
    })
    this._create = profiles.insert({ name: '?' }).prepare()
    this._getByName = profiles
      .select()
      .where(`name = ?`)
      .prepare()
  }

  create({ name }) {
    this._create.run(name)
  }

  getByName(name) {
    return this._getByName.get(name)
  }
}
