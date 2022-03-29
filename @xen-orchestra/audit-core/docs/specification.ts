class Storage {
  acquire: () => Promise<() => undefined>
  del: (id: string) => Promise<void>
  get: (id: string) => Promise<Record | void>
  getLastId: () => Promise<string | void>
  put: (record: Record) => Promise<void>
  setLastId: (id: string) => Promise<void>
}

interface Record {
  data: object
  event: string
  id: string
  previousId: string
  subject: object
  time: number
}

export class AuditCore {
  constructor(storage: Storage) {}
  public add(subject: any, event: string, data: any): Promise<Record> {}
  public checkIntegrity(oldest: string, newest: string): Promise<number> {}
  public getFrom(newest?: string): AsyncIterator {}
  public deleteFrom(newest: string): Promise<void> {}
  public deleteRangeAndRewrite(newest: string, oldest: string): Promise<void> {}
}
