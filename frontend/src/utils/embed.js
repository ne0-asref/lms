import Embed from '@editorjs/embed'
import { h, createApp } from 'vue'
import { registerDirectives } from '@/directives'
import { AppWindow } from 'lucide-vue-next'

// @editorjs/embed has no toolbox entry by design: it only turns a URL pasted
// into an empty text block into a frame. Nothing in the "/" menu says so, and
// pasting an <iframe> tag (the natural thing to try) is silently stripped.
// This subclass adds an "Embed" item that shows a URL field and hands the URL
// to the same paste path, so a link the paste path would frame is framed here
// too, and a link no configured service matches is refused with a message
// instead of silence.
export class EmbedTool extends Embed {
	static get toolbox() {
		const app = createApp({
			render: () =>
				h(AppWindow, { size: 18, strokeWidth: 1.5, color: 'black' }),
		})
		registerDirectives(app)
		const div = document.createElement('div')
		app.mount(div)
		return { title: 'Embed', icon: div.innerHTML }
	}

	// The service key whose pattern matches `url`, or null. `patterns` is
	// filled by Embed.prepare() from the editor's service config; reading it
	// through the base class keeps the subclass in step with whatever the
	// editor registered.
	static matchService(url) {
		const patterns = Embed.patterns || {}
		const hit = Object.keys(patterns).find((key) => patterns[key].test(url))
		return hit || null
	}

	render() {
		if (this.data.service || this.readOnly) return super.render()

		const wrapper = document.createElement('div')
		wrapper.classList.add('embed-tool__prompt')

		const input = document.createElement('input')
		input.type = 'url'
		input.classList.add(this.api.styles.input)
		input.placeholder = this.api.i18n.t(
			'Paste a link (Wokwi, sim86, YouTube, Vimeo) and press Enter'
		)

		const error = document.createElement('div')
		error.classList.add('embed-tool__error')
		error.style.display = 'none'

		const submit = () => {
			const url = input.value.trim()
			if (!url) return
			if (this.setUrl(url)) return
			error.textContent = this.api.i18n.t(
				'No service can frame that link. Use the share or embed URL of a Wokwi project, a sim86 simulation, or a YouTube or Vimeo video.'
			)
			error.style.display = ''
		}

		input.addEventListener('keydown', (event) => {
			// EditorJS listens for these on the editor root: Enter would split
			// the block, Backspace at the start of an input would merge it into
			// the one above. Keep them here while there is text to act on; an
			// empty field still lets Backspace remove the block.
			if (event.key === 'Enter') {
				event.preventDefault()
				event.stopPropagation()
				submit()
			} else if (
				(event.key === 'Backspace' || event.key === 'Delete') &&
				input.value
			) {
				event.stopPropagation()
			}
		})
		// The paste itself stays native (EditorJS leaves <input> alone); read
		// the value once the browser has written it.
		input.addEventListener('paste', () => setTimeout(submit, 0))
		input.addEventListener('change', submit)

		wrapper.append(input, error)
		this.input = input
		this.element = wrapper
		return wrapper
	}

	rendered() {
		if (this.input && this.input.isConnected) this.input.focus()
	}

	// Frame `url` through the matching service, exactly as a paste would.
	// Returns false (and changes nothing) when no service matches.
	setUrl(url) {
		const key = EmbedTool.matchService(url)
		if (!key) return false
		this.input = null
		this.onPaste({ detail: { key, data: url } })
		return true
	}

	// An "Embed" block whose field was never filled saves nothing, rather than
	// a block with no service that the lesson would render as a blank.
	validate(data) {
		return Boolean(data && data.service && data.embed)
	}
}
