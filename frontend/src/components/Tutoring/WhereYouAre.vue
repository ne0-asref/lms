<template>
	<section
		v-if="progress.data?.enabled"
		class="border rounded-md px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
	>
		<div class="text-p-base text-ink-gray-8 leading-6">
			<span class="font-semibold text-ink-gray-9">{{ __('Where you are') }}: </span>
			<span>{{ summaryText }}</span>
			<template v-if="recommended">
				<span>. {{ __('Recommended next') }}: </span>
				<span class="font-semibold text-ink-gray-9">{{ recommendedLabel }}</span>
			</template>
		</div>
		<div class="flex items-center gap-3 shrink-0">
			<router-link
				:to="{ name: 'Progress', query: { course: courseName } }"
				class="text-p-sm text-ink-gray-6 underline underline-offset-2 hover:text-ink-gray-9"
			>
				{{ __('My Progress') }}
			</router-link>
			<router-link v-if="recommendedRoute" :to="recommendedRoute">
				<Button variant="solid">
					{{ __('Start') }}
				</Button>
			</router-link>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Button, createResource } from 'frappe-ui'
import {
	lessonRouteParams,
	masterySummary,
	masterySummaryText,
} from '@/utils/tutoring'
import type { CourseRecommendation, LessonConceptRow } from '@/utils/tutoring'

const props = defineProps<{
	courseName: string
}>()

// Answers {enabled: false} on a site with no tutoring app installed, and the
// whole line stays out of the page. The tiles themselves live on My Progress.
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

const concepts = computed<LessonConceptRow[]>(() => progress.data?.concepts || [])

const summaryText = computed<string>(() =>
	masterySummaryText(masterySummary(concepts.value))
)

const recommended = computed<CourseRecommendation | null>(
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
</script>
