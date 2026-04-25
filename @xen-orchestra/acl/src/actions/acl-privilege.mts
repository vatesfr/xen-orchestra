export default {
  create: true,
  delete: true,
  read: true,
  update: {
    action: true,
    effect: true,
    resource: true,
    selector: true,
  },
}
