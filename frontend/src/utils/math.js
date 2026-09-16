// TeX in lesson bodies. The authoring side stores equations as plain text
// inside ordinary blocks: `$$ … $$` alone in a paragraph for a display
// equation, `\( … \)` inline. Nothing in Editor.js has to know about them;
// once the read-only editor has laid the blocks out, this pass typesets
// them in place with KaTeX. Code blocks and inline code are left alone.
import renderMathInElement from 'katex/contrib/auto-render'
import 'katex/dist/katex.min.css'

export const MATH_DELIMITERS = [
	{ left: '$$', right: '$$', display: true },
	{ left: '\\[', right: '\\]', display: true },
	{ left: '\\(', right: '\\)', display: false },
]

export function renderMath(root) {
	if (!root) return
	renderMathInElement(root, {
		delimiters: MATH_DELIMITERS,
		throwOnError: false,
		ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
		ignoredClasses: ['inline-code', 'codeBoxHolder', 'codeBoxTextArea'],
	})
}
