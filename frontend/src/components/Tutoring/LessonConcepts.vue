<template>
	<section v-if="concepts.data?.enabled && rows.length" class="mt-6 space-y-3">
		<div class="flex items-center gap-2">
			<h2 class="text-lg-semibold text-ink-gray-9">
				{{ __(heading) }}
			</h2>
			<Badge v-if="needWork" theme="orange" size="sm">
				{{ needWork }} {{ __('need work') }}
			</Badge>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
			<Tooltip
				v-for="concept in rows"
				:key="concept.id"
				:text="evidenceText(concept)"
				:hoverDelay="0.3"
			>
				<div class="border rounded-md p-3 h-full flex flex-col justify-between gap-3">
					<div class="text-p-sm text-ink-gray-8 leading-5 min-h-10 line-clamp-2">
						{{ concept.label }}
					</div>
					<MasteryBar :value="concept.p_known" :evidence="concept.evidence_count" />
				</div>
			</Tooltip>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Badge, Tooltip, createResource } from 'frappe-ui'
import MasteryBar from '@/components/Tutoring/MasteryBar.vue'
import { lessonConceptsHeading, needsWorkCount } from '@/utils/tutoring'
import type { LessonConceptRow } from '@/utils/tutoring'

const props = defineProps<{
	lessonName: string
}>()

// Answers {enabled: false} on a site with no tutoring app, or on a lesson
// that neither tags nor tests a concept; the card stays off the page.
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

const evidenceText = (concept: LessonConceptRow): string => {
	const count = concept.evidence_count || 0
	if (!count) return __('No evidence yet')
	return `${count} ${count === 1 ? __('piece of evidence') : __('pieces of evidence')}`
}
</script>
