<template>
	<section
		v-if="concepts.data?.enabled && rows.length"
		class="mt-4 border rounded-md px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-p-sm"
	>
		<span class="font-medium text-ink-gray-9">{{ __(heading) }}:</span>
		<span class="flex flex-wrap items-center gap-x-2 gap-y-1">
			<Tooltip
				v-for="concept in rows"
				:key="concept.id"
				:text="masteryText(concept)"
				:hoverDelay="0.3"
			>
				<span
					:class="
						concept.evidence_count && needsWork(concept.p_known)
							? 'text-ink-amber-3'
							: 'text-ink-gray-7'
					"
				>
					{{ concept.label }}
				</span>
			</Tooltip>
		</span>
		<Badge v-if="needWork" theme="orange" size="sm">
			{{ needWork }} {{ __('need work') }}
		</Badge>
		<router-link
			:to="{ name: 'Progress', query: { course: courseName } }"
			class="ms-auto text-ink-gray-6 underline underline-offset-2 hover:text-ink-gray-9"
		>
			{{ __('My Progress') }}
		</router-link>
	</section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Badge, Tooltip, createResource } from 'frappe-ui'
import {
	lessonConceptsHeading,
	masteryLabel,
	needsWork,
	needsWorkCount,
} from '@/utils/tutoring'
import type { LessonConceptRow } from '@/utils/tutoring'

const props = defineProps<{
	lessonName: string
	courseName: string
}>()

// Answers {enabled: false} on a site with no tutoring app, or on a lesson
// that neither tags nor tests a concept; the line stays off the page.
const concepts = createResource({
	url: 'lms.lms.tutoring.lesson_concepts',
	makeParams() {
		return { lesson: props.lessonName }
	},
	auto: false,
})

watch(
	() => props.lessonName,
	(name) => {
		if (name) concepts.fetch()
	},
	{ immediate: true }
)

const rows = computed<LessonConceptRow[]>(() => concepts.data?.concepts || [])
const heading = computed<string>(() => lessonConceptsHeading(concepts.data?.source))
const needWork = computed<number>(() => needsWorkCount(rows.value))

const masteryText = (concept: LessonConceptRow): string => {
	const count = concept.evidence_count || 0
	if (!count) return __('No evidence yet')
	return `${masteryLabel(concept.p_known)}, ${count} ${
		count === 1 ? __('piece of evidence') : __('pieces of evidence')
	}`
}
</script>
