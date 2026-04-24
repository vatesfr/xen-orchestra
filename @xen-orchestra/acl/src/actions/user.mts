export default {
  create: true,
  delete: true,
  read: true,
  update: {
    name: true,
    password: true,
    permission: true,
    preferences: true,
  },
}
