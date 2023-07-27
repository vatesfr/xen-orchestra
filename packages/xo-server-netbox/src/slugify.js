/**
 * Transforms a string into a slug with pattern ^[-a-zA-Z0-9_]+$
 * @param {string} name
 * @returns {string}
 */
export default function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
