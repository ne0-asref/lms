<template>
	<section
		v-if="status.data?.enabled && (placement === 'status' || files.length)"
		:class="placement === 'status' ? 'mt-6 space-y-4' : 'mt-10 border-t pt-8 space-y-4'"
	>
		<h2 class="text-lg-semibold text-ink-gray-9">
			{{ placement === 'status' ? __('Exercise status') : __('Try it here') }}
		</h2>

		<div v-if="placement === 'status'" class="border rounded-md p-4 space-y-3">
			<div class="flex flex-wrap items-center gap-2">
				<Badge :theme="passed ? 'green' : lastRun ? 'orange' : 'gray'" size="lg">
					{{ __(statusLine) }}
				</Badge>
				<span v-if="receivedAgo" class="text-p-sm text-ink-gray-5">
					{{ receivedAgo }}
				</span>
			</div>

			<div class="flex flex-wrap gap-x-8 gap-y-2">
				<div v-for="fact in facts" :key="fact.label" class="min-w-24">
					<div class="text-p-xs text-ink-gray-5">{{ fact.label }}</div>
					<div class="text-p-sm text-ink-gray-8">{{ fact.value }}</div>
				</div>
			</div>

			<div
				v-if="lastFailureText"
				class="text-p-sm text-ink-gray-7 bg-surface-gray-1 rounded-md p-3"
			>
				{{ lastFailureText }}
			</div>
		</div>

		<div v-if="placement === 'editor' && files.length" class="space-y-3">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<TabButtons
					v-if="files.length > 1"
					v-model="activePath"
					:options="fileTabs"
					class="w-fit"
				/>
				<div v-else class="text-p-sm text-ink-gray-6 font-mono">
					{{ activePath }}
				</div>
				<div class="flex items-center gap-2">
					<Button
						variant="subtle"
						:loading="hinting"
						:disabled="!latestRun"
						@click="askHint()"
					>
						<template #prefix>
							<span class="lucide-lightbulb size-4" />
						</template>
						{{ __('Hint') }}
					</Button>
					<Button variant="solid" :loading="running" @click="runExercise()">
						<template #prefix>
							<span class="lucide-play size-4" />
						</template>
						{{ __('Run') }}
					</Button>
				</div>
			</div>

			<ExerciseEditor
				:key="activePath"
				v-model="activeContent"
				:path="activePath"
			/>

			<div
				v-if="runError"
				class="flex items-start gap-2 border rounded-md p-3 text-p-sm text-ink-amber-3 bg-surface-amber-1"
			>
				<span class="lucide-triangle-alert size-4 mt-0.5 shrink-0" />
				<span>{{ runError }}</span>
			</div>

			<div v-if="runResult" class="border rounded-md p-4 space-y-3">
				<div class="flex flex-wrap items-center gap-2">
					<Badge :theme="runResult.build_status === 'passed' ? 'green' : 'red'">
						{{ __('Build') }}: {{ runResult.build_status || __('unknown') }}
					</Badge>
					<Badge
						:theme="
							runResult.check_status === 'passed'
								? 'green'
								: runResult.check_status === 'not_run'
								? 'gray'
								: 'red'
						"
					>
						{{ __('Check') }}: {{ runResult.check_status || __('not run') }}
					</Badge>
				</div>
				<div v-if="runFailureText" class="text-p-sm text-ink-gray-7">
					{{ runFailureText }}
				</div>
				<pre
					v-if="runResult.compiler_tail"
					class="overflow-x-auto rounded-md bg-surface-gray-2 p-3 text-p-xs text-ink-gray-8 whitespace-pre"
					>{{ runResult.compiler_tail }}</pre
				>
			</div>

			<div
				v-if="hintText"
				class="border rounded-md p-4 space-y-1 bg-surface-gray-1"
			>
				<div class="text-p-xs text-ink-gray-5">
					{{ __('Hint') }} {{ hintNumber }}
				</div>
				<div class="text-p-sm text-ink-gray-8 whitespace-pre-line">
					{{ hintText }}
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Badge, Button, TabButtons, call, createResource } from 'frappe-ui'
import dayjs from '@/utils/dayjs'
import ExerciseEditor from '@/components/Tutoring/ExerciseEditor.vue'
import { firstFailureText, runPassed, runStatusText } from '@/utils/tutoring'
import type { LastRun } from '@/utils/tutoring'

// The local service the learner runs on their own machine. It builds, runs the
// check and posts the run record back to the site itself, so the page only has
// to ask for the status again afterwards.
const RUN_URL = 'http://127.0.0.1:7357/run'

interface ExerciseFile {
	path: string
	content: string
}

const props = withDefaults(
	defineProps<{
		lessonName: string
		placement?: 'status' | 'editor'
	}>(),
	{ placement: 'editor' }
)
const placement = props.placement

// Cached on the lesson so the status card at the top of the page and the
// editor at the bottom read one resource: a run posted from the editor
// refreshes the card without the two ever talking to each other.
const status = createResource({
	url: 'lms.lms.tutoring.exercise_status',
	cache: ['tutoring_exercise_status', props.lessonName],
	makeParams() {
		return { lesson: props.lessonName }
	},
	auto: false,
})

const filesResource = createResource({
	url: 'lms.lms.tutoring.exercise_files',
	makeParams() {
		return { lesson: props.lessonName }
	},
	auto: false,
	onSuccess(data: { files?: ExerciseFile[] }) {
		buffers.value = {}
		const list = data?.files || []
		for (const file of list) buffers.value[file.path] = file.content
		activePath.value = list.length ? list[0].path : ''
	},
})

// The learner's edits, by path. Kept here rather than in the editor so
// switching files does not lose what they typed.
const buffers = ref<Record<string, string>>({})
const activePath = ref('')
const running = ref(false)
const hinting = ref(false)
const runError = ref('')
const runResult = ref<(LastRun & { name?: string; compiler_tail?: string }) | null>(
	null
)
const hintText = ref('')
const hintNumber = ref(0)

watch(
	() => props.lessonName,
	(name) => {
		if (!name) return
		runError.value = ''
		runResult.value = null
		hintText.value = ''
		hintNumber.value = 0
		status.fetch()
		filesResource.fetch()
	},
	{ immediate: true }
)

const lastRun = computed<LastRun | null>(() => status.data?.last || null)
const passed = computed<boolean>(() => runPassed(lastRun.value))
const statusLine = computed<string>(() => runStatusText(lastRun.value))
const lastFailureText = computed<string>(() =>
	firstFailureText(lastRun.value?.first_failure)
)
const runFailureText = computed<string>(() =>
	firstFailureText(runResult.value?.first_failure)
)

const receivedAgo = computed<string>(() => {
	const received = status.data?.last?.received_at
	return received ? dayjs(received).fromNow() : ''
})

const facts = computed(() => {
	const data = status.data || {}
	const rows = [
		{ label: __('Attempts'), value: String(data.attempts ?? 0) },
		{ label: __('Hints used'), value: String(data.hints_used ?? 0) },
	]
	const target = data.last?.target || filesResource.data?.target
	if (target) rows.push({ label: __('Target'), value: target })
	if (data.last?.mode) rows.push({ label: __('Mode'), value: data.last.mode })
	return rows
})

const files = computed<ExerciseFile[]>(() => {
	const list: ExerciseFile[] = filesResource.data?.files || []
	return list.map((file) => ({
		path: file.path,
		content: buffers.value[file.path] ?? file.content,
	}))
})

const fileTabs = computed(() =>
	files.value.map((file) => ({ label: file.path, value: file.path }))
)

const activeContent = computed<string>({
	get() {
		return buffers.value[activePath.value] ?? ''
	},
	set(value: string) {
		buffers.value = { ...buffers.value, [activePath.value]: value }
	},
})

// The name of the run a hint should be about: the one this page just made, or
// the last one the site knows about.
const latestRun = computed<string>(
	() => runResult.value?.name || status.data?.last?.name || ''
)

const runExercise = async () => {
	running.value = true
	runError.value = ''
	hintText.value = ''
	try {
		const response = await fetch(RUN_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				exercise_id: filesResource.data?.exercise_id || status.data?.exercise_id,
				files: files.value,
			}),
		})
		if (!response.ok) {
			runError.value = __('The companion CLI answered with an error.')
			return
		}
		const data = await response.json()
		runResult.value = data?.run || data
		// The local service posts the run record to the site, so the card is
		// one refetch away from the truth rather than something assembled here.
		status.fetch()
	} catch (error) {
		runError.value = __('The companion CLI is not running on this machine.')
	} finally {
		running.value = false
	}
}

const askHint = async () => {
	if (!latestRun.value) return
	hinting.value = true
	try {
		const data = await call('lms.lms.tutoring.hint', {
			run: latestRun.value,
			files: files.value,
		})
		hintNumber.value = data?.number || hintNumber.value + 1
		hintText.value =
			data?.text || __('Hints are not enabled on this site.')
	} catch (error) {
		hintText.value = __('The hint could not be fetched. Try again.')
	} finally {
		hinting.value = false
	}
}
</script>
