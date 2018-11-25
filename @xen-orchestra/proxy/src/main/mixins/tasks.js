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
      parentId: {
        type: 'text',
        optional: true,
      },
      progress: {
        type: 'integer',
        default: '0',
      },
      result: {
        type: 'blob',
        optional: true,
      },
      status: {
        type: 'text',
      },
    })
    this._create = table.insert({ name: '?', parentId: '?' }).prepare()
    this._select = table
      .select()
      .where('id = ?')
      .prepare()
    this._selectAll = table.select().prepare()

    // db.exec(`
    //   CREATE TABLE IF NOT EXISTS tasks (
    //     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    //     data BLOB,
    //     id INTEGER PRIMARY KEY AUTOINCREMENT,
    //     name TEXT NOT NULL,
    //     parentId TEXT,
    //     progress INTEGER NOT NULL DEFAULT 0,
    //     result BLOB,
    //     status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failure')) DEFAULT 'pending',
    //     updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    //   );
    //   CREATE TRIGGER IF NOT EXISTS tasks_updated_at
    //     AFTER UPDATE ON tasks
    //     FOR EACH ROW
    //   BEGIN
    //     UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    //   END;
    // `)
    //
    // this._create = db.prepare(
    //   'INSERT INTO tasks (name, parentId) VALUES (?, ?)'
    // )
    // this._select = db.prepare('SELECT * FROM tasks WHERE id = ?')
    // this._selectAll = db.prepare('SELECT * FROM tasks')
  }

  createTask({ name, parentId }) {
    this._create.run(name, parentId)
  }

  getAllTasks() {
    return this._selectAll.all()
  }

  getTask(id) {
    return this._select.get(id)
  }
}
