interface Storage {
  del: (id: string) => Promise<void>
  get: (id: string) => Promise<Record>
  put: (id: string, record: Record) => Promise<void>

  // TODO: add other methods as necessary
}

class Record {
  id: string

  // TODO: other properties
}

export class AuditCore {
  // TODO: add properties

  constructor({ storage: Storage }) {}

  // TODO: add methods
}
