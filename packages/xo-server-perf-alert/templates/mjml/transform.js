import mjml2html from 'mjml'

export default async function transform(source) {
  return { html: mjml2html(source).html }
}
