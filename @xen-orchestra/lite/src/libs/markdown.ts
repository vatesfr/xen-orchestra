import { type AcceptedLanguage, highlight } from '@/libs/highlight'
import HLJS from 'highlight.js/lib/core'
import { marked } from 'marked'

enum VUE_TAG {
  TEMPLATE = 'vue-template',
  SCRIPT = 'vue-script',
  STYLE = 'vue-style',
}

function extractLang(lang: string | undefined): AcceptedLanguage | VUE_TAG {
  if (lang === undefined) {
    return 'plaintext'
  }

  if (Object.values(VUE_TAG).includes(lang as VUE_TAG)) {
    return lang as VUE_TAG
  }

  if (HLJS.getLanguage(lang) !== undefined) {
    return lang as AcceptedLanguage
  }

  return 'plaintext'
}

marked.use({
  renderer: {
    code({ text, lang }) {
      const code = customHighlight(text, extractLang(lang))
      return `<pre class="hljs"><button class="copy-button" type="button">Copy</button><code class="hljs-code">${code}</code></pre>`
    },
  },
})

function customHighlight(str: string, lang: AcceptedLanguage | VUE_TAG) {
  switch (lang) {
    case VUE_TAG.TEMPLATE: {
      const indented = str
        .trim()
        .split('\n')
        .map(s => `  ${s}`)
        .join('\n')
      return wrap(indented, lang)
    }
    case VUE_TAG.SCRIPT:
    case VUE_TAG.STYLE:
      return wrap(str.trim(), lang)
    default: {
      return copyable(highlight(str, { language: lang }).value)
    }
  }
}

function wrap(str: string, lang: VUE_TAG) {
  let openTag
  let closeTag
  let code

  switch (lang) {
    case VUE_TAG.TEMPLATE:
      openTag = '<template>'
      closeTag = '</template>'
      code = highlight(str, { language: 'xml' }).value
      break
    case VUE_TAG.SCRIPT:
      openTag = '<script lang="ts" setup>'
      closeTag = '</script>'
      code = highlight(str, { language: 'typescript' }).value
      break
    case VUE_TAG.STYLE:
      openTag = '<style lang="postcss" scoped>'
      closeTag = '</style>'
      code = highlight(str, { language: 'css' }).value
      break
  }

  const openTagHtml = highlight(openTag, { language: 'xml' }).value
  const closeTagHtml = highlight(closeTag, { language: 'xml' }).value

  return `${openTagHtml}${copyable(code)}${closeTagHtml}`
}

function copyable(code: string) {
  return `<div class="copyable">${code}</div>`
}

export default marked
