/**
 * Transforms a string into a slug that respects the pattern ^[-a-zA-Z0-9_]+$
 * required by Netbox
 * @param {string} name
 * @returns {string}
 */
export default function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
