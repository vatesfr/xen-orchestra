import HLJS from "highlight.js";
import { marked } from "marked";

marked.use({
  renderer: {
    code(str: string, lang: string) {
      const code = highlight(str, HLJS.getLanguage(lang) ? lang : "plaintext");
      return `<pre class="hljs"><button class="copy-button" type="button">Copy</button><code class="hljs-code">${code}</code></pre>`;
    },
  },
});

function highlight(str: string, lang: string) {
  switch (lang) {
    case "vue-template": {
      const indented = str
        .trim()
        .split("\n")
        .map((s) => `  ${s}`)
        .join("\n");
      return wrap(indented, "template");
    }
    case "vue-script":
      return wrap(str.trim(), "script");
    case "vue-style":
      return wrap(str.trim(), "style");
    default: {
      return copyable(HLJS.highlight(str, { language: lang }).value);
    }
  }
}

function wrap(str: string, tag: "template" | "script" | "style") {
  let openTag;
  let code;

  switch (tag) {
    case "template":
      openTag = "<template>";
      code = HLJS.highlight(str, { language: "xml" }).value;
      break;
    case "script":
      openTag = '<script lang="ts" setup>';
      code = HLJS.highlight(str, { language: "typescript" }).value;
      break;
    case "style":
      openTag = '<style lang="postcss" scoped>';
      code = HLJS.highlight(str, { language: "scss" }).value;
      break;
  }

  const openTagHtml = HLJS.highlight(openTag, { language: "xml" }).value;
  const closeTagHtml = HLJS.highlight(`</${tag}>`, { language: "xml" }).value;

  return `${openTagHtml}${copyable(code)}${closeTagHtml}`;
}

function copyable(code: string) {
  return `<div class="copyable">${code}</div>`;
}

export default marked;
