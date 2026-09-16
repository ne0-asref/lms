import { describe, expect, it } from 'vitest'
import { renderMath } from '@/utils/math'

const render = (html: string) => {
	const root = document.createElement('div')
	root.innerHTML = html
	renderMath(root)
	return root
}

describe('renderMath', () => {
	it('typesets inline \\( \\) and display $$ $$ in place', () => {
		const root = render('<p>where \\(V_{res}\\) is the step</p><p>$$V_{res} = \\frac{V_{REF+}}{2^n-1}$$</p>')
		expect(root.querySelectorAll('.katex').length).toBe(2)
		expect(root.querySelectorAll('.katex-display').length).toBe(1)
		expect(root.textContent).not.toContain('\\(')
	})

	it('leaves code alone', () => {
		const root = render('<pre>$$x$$</pre><span class="inline-code">\\(y\\)</span><p>price $$ signs</p>')
		expect(root.querySelectorAll('.katex').length).toBe(0)
		expect(root.textContent).toContain('$$x$$')
	})

	it('shows the source instead of throwing on bad TeX', () => {
		const root = render('<p>\\(\\frac{a\\)</p>')
		expect(root.textContent).toContain('\\frac{a')
	})
})
