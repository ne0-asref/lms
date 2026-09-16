import { describe, it, expect, beforeEach } from 'vitest'
import { EmbedTool } from '@/utils/embed'

// The services the editor registers in getEditorTools; two are enough to
// exercise matching. The regexes are copied, not imported: '@/utils' drags in
// frappe-ui's resource plugin, which does not resolve under vitest.
const services = {
	sim86: {
		regex: /^https:\/\/app\.sim86\.com\/embed\/([0-9a-f-]{36}(?:\?[^\s#]*)?)$/,
		embedUrl: 'https://app.sim86.com/embed/<%= remote_id %>',
		html: "<iframe style='width: 100%; height: 560px;' frameborder='0'></iframe>",
		height: 560,
		width: 580,
	},
	wokwi: {
		regex: /^https:\/\/wokwi\.com\/projects\/(\d+)(?:[\/?#].*)?$/,
		embedUrl: 'https://wokwi.com/projects/<%= remote_id %>',
		html: "<iframe style='width: 100%; height: 600px;' frameborder='0'></iframe>",
		height: 600,
		width: 580,
	},
}
EmbedTool.prepare({ config: { services } })

const api = {
	styles: { input: 'cdx-input' },
	i18n: { t: (s: string) => s },
}
const SIM86 =
	'https://app.sim86.com/embed/3bbeb9c3-8de9-43bd-8367-863964630063?layout=tabs&code=1&files=0&serial=1&view=simulation'

type Tool = InstanceType<typeof EmbedTool> & {
	data: { service?: string; embed?: string; source?: string }
	element: HTMLElement
}

function mount(data = {}, readOnly = false): { tool: Tool; root: HTMLElement } {
	const tool = new EmbedTool({ data, api, readOnly }) as unknown as Tool
	const root = document.createElement('div')
	root.appendChild(tool.render())
	document.body.appendChild(root)
	tool.rendered()
	return { tool, root }
}

describe('EmbedTool', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
	})

	it('appears in the toolbox as Embed with an icon', () => {
		const box = EmbedTool.toolbox
		expect(box.title).toBe('Embed')
		expect(box.icon).toContain('<svg')
	})

	it('renders a focused URL field for a block inserted from the menu', () => {
		const { root } = mount()
		const input = root.querySelector('input') as HTMLInputElement
		expect(input).not.toBeNull()
		expect(input.className).toBe('cdx-input')
		expect(document.activeElement).toBe(input)
		expect(root.querySelector('iframe')).toBeNull()
	})

	it('frames a matching URL on Enter, keeping the query string', () => {
		const { tool, root } = mount()
		const input = root.querySelector('input') as HTMLInputElement
		input.value = SIM86
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
		expect(tool.data.service).toBe('sim86')
		expect(tool.data.embed).toBe(SIM86)
		expect(tool.data.source).toBe(SIM86)
		expect(root.querySelector('input')).toBeNull()
		expect(root.querySelector('iframe')?.getAttribute('src')).toBe(SIM86)
	})

	it('maps a Wokwi share link to the project frame', () => {
		const { tool } = mount()
		expect(tool.setUrl('https://wokwi.com/projects/123456?foo=1')).toBe(true)
		expect(tool.data.embed).toBe('https://wokwi.com/projects/123456')
	})

	it('refuses a URL no service matches and says so', () => {
		const { tool, root } = mount()
		const input = root.querySelector('input') as HTMLInputElement
		input.value = 'https://example.com/anything'
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
		expect(tool.data.service).toBeUndefined()
		expect(root.querySelector('input')).toBe(input)
		const error = root.querySelector('.embed-tool__error') as HTMLElement
		expect(error.style.display).toBe('')
		expect(error.textContent).toContain('No service can frame that link')
	})

	it('does not let Enter or Backspace reach the editor while the field has text', () => {
		const { root } = mount()
		const input = root.querySelector('input') as HTMLInputElement
		const reached: string[] = []
		root.addEventListener('keydown', (e) => reached.push((e as KeyboardEvent).key))
		input.value = 'partial'
		for (const key of ['Enter', 'Backspace', 'a']) {
			input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
		}
		expect(reached).toEqual(['a'])
		input.value = ''
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
		expect(reached).toEqual(['a', 'Backspace'])
	})

	it('drops an unfilled block on save and keeps a filled one', () => {
		const { tool } = mount()
		expect(tool.validate(tool.data)).toBe(false)
		tool.setUrl(SIM86)
		expect(tool.validate(tool.data)).toBe(true)
	})

	it('renders saved data as the frame, read-only included', () => {
		const { root } = mount({ service: 'sim86', source: SIM86, embed: SIM86, height: 560, width: 580 }, true)
		expect(root.querySelector('input')).toBeNull()
		expect(root.querySelector('iframe')?.getAttribute('src')).toBe(SIM86)
	})
})
