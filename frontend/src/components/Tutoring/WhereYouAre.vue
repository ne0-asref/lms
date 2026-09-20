<template>
	<section
		v-if="progress.data?.enabled"
		class="border rounded-md p-4 md:p-5 space-y-4"
	>
		<div class="flex items-center gap-2">
			<h2 class="text-lg-semibold text-ink-gray-9">
				{{ __('Where you are') }}
			</h2>
			<Badge v-if="needsWorkCount" theme="orange" size="sm">
				{{ needsWorkCount }} {{ __('need work') }}
			</Badge>
		</div>

		<div
			v-if="concepts.length"
			class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
		>
			<Tooltip
				v-for="concept in concepts"
				:key="concept.id"
				:text="evidenceText(concept)"
				:hoverDelay="0.3"
			>
				<div class="border rounded-md p-3 space-y-2 h-full">
					<div class="text-p-sm text-ink-gray-7 leading-4 min-h-8">
						{{ concept.label }}
					</div>
					<MasteryBar :value="concept.p_known" :evidence="concept.evidence_count" />
				</div>
			</Tooltip>
		</div>
		<div v-else class="text-p-sm text-ink-gray-5">
			{{ __('No concepts recorded for this course yet.') }}
		</div>

		<div
			v-if="recommended"
			class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-t pt-4"
		>
			<div class="text-p-base text-ink-gray-8">
				<span>{{ __('Recommended next') }}: </span>
				<span class="font-semibold text-ink-gray-9">{{
					recommendedLabel
				}}</span>
				<span v-if="recommended.reason" class="text-ink-gray-6">
					. {{ recommended.reason }}
				</span>
			</div>
			<router-link v-if="recommendedRoute" :to="recommendedRoute">
				<Button variant="solid">
					{{ __('Start') }}
				</Button>
			</router-link>
		</div>

		<div class="text-p-sm text-ink-gray-5">
			{{ __('This is advisory. Every lesson stays open.') }}
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Badge, Button, Tooltip, createResource } from 'frappe-ui'
import MasteryBar from '@/components/Tutoring/MasteryBar.vue'
import { lessonRouteParams, needsWork } from '@/utils/tutoring'

interface ConceptRow {
	id: string
	label: string
	p_known: number
	evidence_count?: number
}

interface Recommendation {
	lesson: string
	title: string
	chapter_title?: string
	reason?: string
}

const props = defineProps<{
	courseName: string
}>()

// Answers {enabled: false} on a site with no tutoring app installed, and the
// whole strip stays out of the page.
const progress = createResource({
	url: 'lms.lms.tutoring.course_progress',
	makeParams() {
		return { course: props.courseName }
	},
	auto: false,
})

watch(
	() => props.courseName,
	(name) => {
		if (name) progress.fetch()
	},
	{ immediate: true }
)

const concepts = computed<ConceptRow[]>(() => progress.data?.concepts || [])

const needsWorkCount = computed<number>(
	() => concepts.value.filter((c) => c.evidence_count && needsWork(c.p_known)).length
)

const recommended = computed<Recommendation | null>(
	() => progress.data?.recommended || null
)

// Lesson titles repeat across chapters ("Overview"), so the chapter leads.
const recommendedLabel = computed<string>(() => {
	const r = recommended.value
	if (!r) return ''
	return r.chapter_title ? `${r.chapter_title}, ${r.title}` : r.title
})

const recommendedRoute = computed(() => {
	const params = lessonRouteParams(
		props.courseName,
		recommended.value?.lesson
	)
	if (!params) return null
	return { name: 'Lesson', params }
})

const evidenceText = (concept: ConceptRow): string => {
	const count = concept.evidence_count || 0
	if (!count) return __('No evidence yet')
	return `${count} ${count === 1 ? __('piece of evidence') : __('pieces of evidence')}`
}
</script>
