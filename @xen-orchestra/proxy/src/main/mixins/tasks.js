export default class Tasks {
  get tasks() {
    return this._selectAll.iterate()
  }

  constructor(app) {
    const { db } = app
    const table = db.createTable('tasks', {
      data: {
        type: 'blob',
        optional: true,
      },
      name: 'text',
      progress: {
        type: 'integer',
        default: 0,
      },
      result: {
        type: 'blob',
        optional: true,
      },
      status: {
        default: 'pending',
        enum: ['pending', 'success', 'failure'],
        type: 'text',
      },
    })
    this._create = table.insert({ name: '?' }).prepare()
    this._getFromRowid = table.getFromRowid
    this._select = table
      .select()
      .where('id = ?')
      .prepare()
    this._selectAll = table.select().prepare()

    const relationship = db.createTable('task_children', {
      parentId: 'text',
      childId: 'text',
    })
    this._addRelationship = relationship
      .insert({ childId: '?', parentId: '?' })
      .prepare()

    // this._create = db.prepare(
    //   'INSERT INTO tasks (name, parentId) VALUES (?, ?)'
    // )
    // this._select = db.prepare('SELECT * FROM tasks WHERE id = ?')
    // this._selectAll = db.prepare('SELECT * FROM tasks')
  }

  create({ name, parentId }) {
    const task = this._getFromRowid.get(this._create.run(name).lastInsertRowid)
    if (parentId !== undefined) {
      this._addRelationship.run(task.id, parentId)
    }
    return task
  }

  getAll() {
    return this._selectAll.all()
  }

  get(id) {
    return this._select.get(id)
  }
}
