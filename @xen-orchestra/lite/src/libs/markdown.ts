import HLJS from "highlight.js";
import { marked } from "marked";

enum VUE_TAG {
  TEMPLATE = "vue-template",
  SCRIPT = "vue-script",
  STYLE = "vue-style",
}

marked.use({
  renderer: {
    code(str: string, lang: string) {
      const code = highlight(
        str,
        Object.values(VUE_TAG).includes(lang as VUE_TAG) ||
          HLJS.getLanguage(lang)
          ? lang
          : "plaintext"
      );
      return `<pre class="hljs"><button class="copy-button" type="button">Copy</button><code class="hljs-code">${code}</code></pre>`;
    },
  },
});

function highlight(str: string, lang: string) {
  switch (lang) {
    case VUE_TAG.TEMPLATE: {
      const indented = str
        .trim()
        .split("\n")
        .map((s) => `  ${s}`)
        .join("\n");
      return wrap(indented, lang);
    }
    case VUE_TAG.SCRIPT:
    case VUE_TAG.STYLE:
      return wrap(str.trim(), lang);
    default: {
      return copyable(HLJS.highlight(str, { language: lang }).value);
    }
  }
}

function wrap(str: string, lang: VUE_TAG) {
  let openTag;
  let closeTag;
  let code;

  switch (lang) {
    case VUE_TAG.TEMPLATE:
      openTag = "<template>";
      closeTag = "</template>";
      code = HLJS.highlight(str, { language: "xml" }).value;
      break;
    case VUE_TAG.SCRIPT:
      openTag = '<script lang="ts" setup>';
      closeTag = "</script>";
      code = HLJS.highlight(str, { language: "typescript" }).value;
      break;
    case VUE_TAG.STYLE:
      openTag = '<style lang="postcss" scoped>';
      closeTag = "</style>";
      code = HLJS.highlight(str, { language: "scss" }).value;
      break;
  }

  const openTagHtml = HLJS.highlight(openTag, { language: "xml" }).value;
  const closeTagHtml = HLJS.highlight(closeTag, { language: "xml" }).value;

  return `${openTagHtml}${copyable(code)}${closeTagHtml}`;
}

function copyable(code: string) {
  return `<div class="copyable">${code}</div>`;
}

export default marked;
