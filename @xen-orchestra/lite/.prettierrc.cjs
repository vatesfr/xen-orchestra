module.exports = {
  importOrder: [
    "^[^/]+$",
    "<THIRD_PARTY_MODULES>",
    "^@/components/(.*)$",
    "^@/composables/(.*)$",
    "^@/libs/(.*)$",
    "^@/router/(.*)$",
    "^@/stores/(.*)$",
    "^@/views/(.*)$",
  ],
  importOrderSeparation: false,
  importOrderSortSpecifiers: true,
};
