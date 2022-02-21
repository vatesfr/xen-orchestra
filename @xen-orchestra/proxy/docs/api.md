## Transport

The API is based on line-delimited [JSON-RPC
2.0](https://www.jsonrpc.org/specification) over HTTP.

### Authentication

A valid authentication token should be attached as a cookie to all HTTP
requests:

```http
POST /api/v1 HTTP/1.1
Cookie: authenticationToken=TN2YBOMYtXB_hHtf4wTzm9p5tTuqq2i15yeuhcz2xXM
```

The server will respond to an invalid token with a `401 Unauthorized` status.

The server can request the client to update its token with a `Set-Cookie` header:

```http
HTTP/1.1 200 OK
Set-Cookie: authenticationToken=KQxQdm2vMiv7jBIK0hgkmgxKzemd8wSJ7ugFGKFkTbs
```

### Remote Procedure Call

#### Request

A call is a JSON-RPC request over a POST HTTP request:

```http
POST /api/v1 HTTP/1.1
Host: proxy1.xo.company.tld
Content-Type: application/json
Content-Length: 69

{"id":0,"jsonrpc":"2.0","method":"task.getAll","params":{"limit":10}}
```

#### Response

##### JSON-RPC response

Plain JSON-RPC response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"id":0,"jsonrpc":"2.0","result": "toto"}
```

NDJSON Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"id":0,"jsonrpc":"2.0","result":{"$responseType":"ndjson"}}
{"id":"task1"}
{"id":"task2"}
{"id":"task3"}
{"id":"task4"}
{"id":"task5"}
```

##### Binary response

```http
HTTP/1.1 200 OK
Content-Type: application/octet-stream

<Binary data>
```

## Methods

```ts
interface Remote {
  url: string
  options?: string
}

declare namespace system {
  function listMethods(): string[]
  function methodSignature(_: { name: string }): { params: { [string]: object } }
}

declare namespace event {
  interface Event {
    class: 'Task'
    operation: 'add' | 'mod' | 'del'
    snapshot: Task
  }

  function from(_: { token: string = ''; timeout?: number }): {
    events: Event[]
    token: string
  }
}

declare namespace backup {
  type SimpleIdPattern = { id: string | { __or: string[] } }

  interface BackupJob {
    id: string
    type: 'backup'
    compression?: 'native' | 'zstd' | ''
    mode: Mode
    name: string
    remotes?: SimpleIdPattern
    settings: $Dict<Settings>
    srs?: SimpleIdPattern
    type: 'backup'
    vms: Pattern
  }
  interface MetadataBackupJob {
    id: string
    name: string
    pools?: SimpleIdPattern
    remotes: SimpleIdPattern
    settings: Settings
    type: 'metadataBackup'
    xoMetadata?: string
  }

  interface Schedule {
    id: string
  }

  interface Xapi {
    allowUnauthorized: boolean
    credentials: object
    url: string
  }

  function importVmBackup(_: {
    backupId: string
    remote: Remote
    settings?: { newMacAddresses?: boolean; mapVdisSrs?: object }
    srUuid: string
    xapi: Xapi
    streamLogs: boolean = false
  }): string

  function listPoolMetadataBackups(_: { remotes: { [id: string]: Remote } }): {
    [remoteId: string]: { [poolUuid: string]: object[] }
  }

  function listVmBackups(_: { remotes: { [remoteId: string]: Remote } }): {
    [remoteId: string]: { [vmUuid: string]: object[] }
  }

  function listXoMetadataBackups(_: { remotes: { [id: string]: Remote } }): { [remoteId: string]: object[] }

  function run(_: {
    job: BackupJob | MetadataBackupJob
    remotes: { [id: string]: Remote }
    schedule: Schedule
    xapis?: { [id: string]: Xapi }
    recordToXapi?: { [recordUuid: string]: string }
    streamLogs: boolean = false
  }): string

  function restoreMetadataBackup(_: { backupId: string; remote: Remote; xapi: Xapi }): ReadableStream
}

declare namespace task {
  type Status = 'canceled' | 'failure' | 'interrupted' | 'pending' | 'skipped' | 'success'

  interface Task {
    data: any
    end?: number
    id: string
    start: number
    status: Status
    tasks?: Task[]
  }

  function cancel(_: { taskId: string })
  function destroy(_: { taskId: string })
  function get(_: { taskId: string }): string
  function getAll(): Task[]
}

declare namespace remote {
  function test(Remote): object
}
```
