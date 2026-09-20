<template>
	<div v-if="rows.length" class="mt-10">
		<div class="flex items-center justify-between mb-3">
			<h2 class="font-semibold text-md text-ink-gray-9">
				{{ __('Pick up where you left off') }}
			</h2>
			<router-link :to="{ name: 'Progress' }">
				<span class="flex items-center gap-x-1 text-ink-gray-5 text-xs">
					<span>
						{{ __('View progress') }}
					</span>
					<span class="lucide-move-right size-3 rtl:rotate-180" />
				</span>
			</router-link>
		</div>
		<div class="border rounded-md divide-y">
			<router-link
				v-for="row in rows"
				:key="row.course"
				:to="row.route"
				class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-surface-gray-1"
			>
				<div>
					<div class="text-p-base text-ink-gray-8 font-medium">
						{{ row.courseTitle }}
					</div>
					<div class="text-p-sm text-ink-gray-5">
						{{ row.label }}
					</div>
				</div>
			</router-link>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { createResource } from 'frappe-ui'
import { coursesWithRecommendation, lessonRouteParams } from '@/utils/tutoring'

interface StripRow {
	course: string
	courseTitle: string
	label: string
	route: { name: string; params: Record<string, string> }
}

// Answers {enabled: false} on a site with no tutoring app installed, and the
// whole strip stays out of the page.
const progress = createResource({
	url: 'lms.lms.tutoring.learner_progress',
	cache: ['tutoring_learner_progress'],
	auto: true,
})

const rows = computed<StripRow[]>(() => {
	if (!progress.data?.enabled) return []
	const built: StripRow[] = []
	for (const row of coursesWithRecommendation(progress.data?.courses)) {
		const params = lessonRouteParams(row.course, row.recommendation?.lesson)
		if (!params) continue
		built.push({
			course: row.course,
			courseTitle: row.course_title || row.course,
			// Lesson titles repeat across chapters ("Overview"), so the chapter leads.
			label: row.recommendation?.chapter_title
				? `${row.recommendation.chapter_title}, ${row.recommendation.title}`
				: row.recommendation?.title || '',
			route: { name: 'Lesson', params },
		})
	}
	return built
})
</script>
