<template>
	<div class="border rounded-md overflow-hidden">
		<textarea
			v-if="plain"
			ref="area"
			:value="modelValue"
			spellcheck="false"
			class="w-full h-80 p-3 font-mono text-p-sm text-ink-gray-8 bg-surface-base focus:outline-none resize-y"
			:aria-label="__('Exercise code')"
			@input="onInput"
			@keydown.tab.prevent="insertTab"
		/>
		<div v-else ref="host" class="tutoring-editor text-p-sm" />
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
	modelValue: string
	path?: string
}>()

const emit = defineEmits<{
	'update:modelValue': [value: string]
}>()

// Flipped on when CodeMirror cannot be loaded (an old build of the assets, a
// blocked chunk). The textarea below is then the editor, tab handling and all.
const plain = ref(false)
const host = ref<HTMLElement | null>(null)
const area = ref<HTMLTextAreaElement | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let view: any = null

const onInput = (event: Event) => {
	emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

// A tab in a plain textarea moves focus out of it, which is useless in an
// editor, so insert two spaces at the caret instead.
const insertTab = () => {
	const el = area.value
	if (!el) return
	const start = el.selectionStart
	const end = el.selectionEnd
	const value = `${props.modelValue.slice(0, start)}  ${props.modelValue.slice(
		end
	)}`
	emit('update:modelValue', value)
	requestAnimationFrame(() => {
		el.selectionStart = el.selectionEnd = start + 2
	})
}

// CodeMirror is pulled in on demand, so it forms its own async chunk and no
// page that never shows an exercise pays for it.
onMounted(async () => {
	try {
		const [{ EditorState }, { EditorView }, { basicSetup }, { rust }] =
			await Promise.all([
				import('@codemirror/state'),
				import('@codemirror/view'),
				import('codemirror'),
				import('@codemirror/lang-rust'),
			])
		if (plain.value) return
		const extensions = [
			basicSetup,
			rust(),
			EditorView.lineWrapping,
			EditorView.updateListener.of((update) => {
				if (!update.docChanged) return
				emit('update:modelValue', update.state.doc.toString())
			}),
		]
		view = new EditorView({
			state: EditorState.create({
				doc: props.modelValue,
				extensions,
			}),
			parent: host.value as HTMLElement,
		})
	} catch (error) {
		console.error('Falling back to a plain editor', error)
		plain.value = true
	}
})

// The parent swaps files by swapping the bound value. Replace the document
// only when it really differs, or every keystroke would reset the cursor.
watch(
	() => props.modelValue,
	(value) => {
		if (!view) return
		const current = view.state.doc.toString()
		if (current === value) return
		view.dispatch({
			changes: { from: 0, to: current.length, insert: value },
		})
	}
)

onBeforeUnmount(() => {
	view?.destroy()
	view = null
})
</script>

<style scoped>
.tutoring-editor :deep(.cm-editor) {
	max-height: 28rem;
}

.tutoring-editor :deep(.cm-scroller) {
	font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.tutoring-editor :deep(.cm-editor.cm-focused) {
	outline: none;
}
</style>
