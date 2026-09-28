import { assertSessionAttachable, attachSession, createSession, disconnectSession } from './browser-media-attach.mjs'

const TAGS = ['browser-media', 'vms']

// No ACL middleware: these routes are only available to administrators.
const REQUIRED_PRIVILEGE = 'Required privilege:\n- administrator'

const QUERY_SYNC = { sync: { type: 'boolean', optional: true } }

const PARAMS_ID = {
  id: { type: 'string', example: '3f1d0c9e8b7a6f5e4d3c2b1a09f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6' },
}

const SESSION_FIELDS = {
  id: { type: 'string', example: '3f1d0c9e8b7a6f5e4d3c2b1a09f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6' },
  vmId: { type: 'string', example: '613f541c-4bed-fc77-7ca8-2db6b68f079c' },
  name: { type: 'string', example: 'debian-13.1.0-amd64-netinst.iso' },
  size: { type: 'number', example: 790626304 },
  status: { type: 'enum', enum: ['waiting-for-browser', 'connected', 'attached', 'disconnected'], example: 'attached' },
}

function getStatus(session) {
  if (session.closed) return 'disconnected'
  if (session.operation !== undefined) return 'attached'
  return session.socket === undefined ? 'waiting-for-browser' : 'connected'
}

const serializeSession = session => ({
  id: session.id,
  vmId: session.vm,
  name: session.name,
  size: session.size,
  status: getStatus(session),
})

export function registerBrowserMediaRest(xo, media) {
  const getSession = (restApi, id, { allowClosed = false } = {}) =>
    media.get(id, restApi.getCurrentUser().id, allowClosed)

  return xo.registerRestRoutes([
    {
      method: 'get',
      endpoint: 'browser-media',
      description: `Experimental: list your browser media sessions.\n\n${REQUIRED_PRIVILEGE}`,
      tags: TAGS,
      responses: [
        { status: 200, description: 'Your sessions, including the ones whose storage is being released' },
        // routes are not registered when `iscsi.advertisedAddress` is not set
        { status: 404, description: 'Browser media is not available on this XO' },
      ],
      callback: ({ restApi }) => {
        const owner = restApi.getCurrentUser().id
        return [...media.sessions.values()].filter(session => session.owner === owner).map(serializeSession)
      },
    },
    {
      method: 'post',
      endpoint: 'browser-media',
      description: [
        'Experimental: stream an ISO selected in the browser into a VM CD drive.',
        '',
        'Creates a session and returns the WebSocket path the browser must connect to, from the same origin, to serve',
        'the ISO content. The path can be used once. The session is then inserted with `actions/attach`.',
        '',
        'Once connected, the browser receives `{"ready": true}`, then read requests `{"id", "offset", "length"}`',
        '(at most 1 MiB each). It answers each with a binary message: `id` as a big-endian uint32, followed by',
        'exactly `length` bytes of the ISO.',
        '',
        REQUIRED_PRIVILEGE,
      ].join('\n'),
      tags: TAGS,
      middlewares: [{ name: 'json' }],
      body: {
        vmId: { type: 'string', example: '613f541c-4bed-fc77-7ca8-2db6b68f079c' },
        name: { type: 'string', example: 'debian-13.1.0-amd64-netinst.iso' },
        size: { type: 'number', example: 790626304 },
      },
      responses: [
        {
          status: 201,
          description: 'Session created, waiting for the browser',
          schema: {
            id: SESSION_FIELDS.id,
            socket: { type: 'string', example: '/api/browser-media/9c1b.../socket' },
          },
        },
        { status: 403, description: 'Too many sessions, or xo-server is stopping' },
        { status: 404, description: 'VM not found, or browser media is not available on this XO' },
        { status: 409, description: 'The VM already has a session, or is neither running nor halted' },
        { status: 422, description: 'The ISO size is not a multiple of 512 bytes between 32 KiB and 128 GiB' },
      ],
      callback: ({ req, res, restApi }) => {
        const { vmId, name, size } = req.body
        const vm = xo.getObject(vmId, 'VM')
        const session = createSession(media, { owner: restApi.getCurrentUser().id, vm, name, size })
        res.status(201)
        return session
      },
    },
    {
      method: 'post',
      endpoint: 'browser-media/{id}/actions/attach',
      description: [
        'Experimental: insert the ISO in the VM CD drive, once the browser is connected.',
        '',
        'The VM must be halted, or running with an empty CD drive already plugged. If a halted VM has no CD drive,',
        'a bootable one is created. The ISO is attached to a single host: the VM cannot migrate while it is inserted.',
        '',
        REQUIRED_PRIVILEGE,
      ].join('\n'),
      tags: TAGS,
      params: PARAMS_ID,
      query: QUERY_SYNC,
      responses: [
        { status: 200, description: 'ISO inserted', schema: { vdi: { type: 'string', example: 'b2a4c0e8-...' } } },
        { status: 202, description: 'Action executed asynchronously' },
        { status: 404, description: 'Session not found' },
        { status: 409, description: 'Browser not connected, session already attached, or VM in the wrong state' },
      ],
      callback: ({ req, restApi, createAction }) => {
        // checked first, so that they are reported as 404/409 rather than as a failed task
        const session = getSession(restApi, req.params.id)
        assertSessionAttachable(session)
        return createAction(() => attachSession(xo, media, session), {
          sync: req.query.sync ?? false,
          taskProperties: { name: 'attach browser media', objectId: session.vm },
        })
      },
    },
    {
      method: 'delete',
      endpoint: 'browser-media/{id}',
      description: [
        'Experimental: eject the ISO and release its storage. The LUN content is never modified.',
        '',
        REQUIRED_PRIVILEGE,
      ].join('\n'),
      tags: TAGS,
      params: PARAMS_ID,
      responses: [
        { status: 204, description: 'Session closed and storage released' },
        { status: 404, description: 'Session not found' },
      ],
      callback: async ({ req, restApi }) => {
        await disconnectSession(media, getSession(restApi, req.params.id, { allowClosed: true }))
      },
    },
  ])
}
