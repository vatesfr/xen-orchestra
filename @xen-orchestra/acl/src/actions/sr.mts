export default {
  create: true,
  delete: true,
  forget: true,
  import: {
    vdi: {
      upload: true,
      /**
       * Warning: lets the holder make XO send a GET request to any HTTP(S) URL, including internal addresses
       * reachable from the XO server (localhost, management network, etc.).
       *
       * Covered by `import:vdi`, `import` and `*`: only grant these to trusted users.
       */
      url: true,
    },
    vm: true,
  },
  'migrate-receive': true,
  read: true,
  'reclaim-space': true,
  scan: true,
  update: {
    tags: true,
  },
}
