import type { HighlightResult } from 'highlight.js'
import HLJS from 'highlight.js/lib/core'
import cssLang from 'highlight.js/lib/languages/css'
import jsonLang from 'highlight.js/lib/languages/json'
import textLang from 'highlight.js/lib/languages/plaintext'
import tsLang from 'highlight.js/lib/languages/typescript'
import xmlLang from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/github-dark.css'

export type AcceptedLanguage = 'xml' | 'css' | 'typescript' | 'json' | 'plaintext'

HLJS.registerLanguage('xml', xmlLang)
HLJS.registerLanguage('css', cssLang)
HLJS.registerLanguage('typescript', tsLang)
HLJS.registerLanguage('json', jsonLang)
HLJS.registerLanguage('plaintext', textLang)

export const highlight: (
  code: string,
  options: { language: AcceptedLanguage },
  ignoreIllegals?: boolean
) => HighlightResult = HLJS.highlight
