export default {
  create: true,
  delete: true,
  forget: true,
  import: {
    vdi: true,
    /**
     * Warning: lets the holder make XO download any HTTP(S) URL, including internal addresses
     * reachable from the XO server (localhost, management network, etc.).
     *
     * Covered by `import` and `*`: only grant these to trusted users.
     */
    'vdi-from-url': true,
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
