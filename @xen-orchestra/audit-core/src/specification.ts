interface Storage {
  del: (id: string) => Promise<void>
  get: (id: string) => Promise<Record>
  getLastId: () => Promise<string>
  put: (id: string, record: Record) => Promise<void>
  set: (id: string, record: Record) => Promise<void>
  setLastRecord: (id: string, record: Record) => Promise<void>
}

class Record {
  data: object
  event: string
  id: string
  previousId: string
  subject: object
  time: number
}

export class AuditCore {
  constructor(storage: Storage) {}
  public add(subject: any, event: string, data: any): Record {}
  public checkCorrespondence(newest: string): string {}
  public checkIntegrity(oldest: string, newest: string): void {}
  public getRecords(): Iterator {}
}
