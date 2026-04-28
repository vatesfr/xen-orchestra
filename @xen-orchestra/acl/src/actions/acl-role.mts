export default {
  create: true,
  delete: true,
  read: true,
  update: {
    description: true,
    groups: true,
    name: true,
    users: true,
  },
}
