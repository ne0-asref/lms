<template>
	<div>
		<PageHeader :breadcrumbs="breadcrumbs" />

		<div
			v-if="progress.loading && !progress.data"
			class="flex flex-1 items-center justify-center p-5"
		>
			<LoadingIndicator class="size-5 text-ink-gray-5" />
		</div>

		<div
			v-else-if="!progress.data?.enabled"
			class="p-5 max-w-3xl mx-auto text-center space-y-2 mt-10"
		>
			<div class="text-lg-semibold text-ink-gray-8">
				{{ __('Tutoring is not enabled on this site.') }}
			</div>
			<div class="text-p-base text-ink-gray-5">
				{{
					__(
						'Once it is, this page tracks every concept you have practised and points at the exercise that fixes the weak ones.'
					)
				}}
			</div>
		</div>

		<div v-else class="p-5 space-y-8">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h1 class="text-2xl-semibold text-ink-gray-9">
					{{ __('My Progress') }}
				</h1>
				<FormControl
					v-model="selectedCourse"
					type="select"
					:options="courseOptions"
					class="w-64"
				/>
			</div>

			<!-- One course: its tiles, the recommended step and what to fix. -->
			<template v-if="selectedCourse">
				<div
					v-if="course.loading && !course.data"
					class="flex items-center justify-center p-5"
				>
					<LoadingIndicator class="size-5 text-ink-gray-5" />
				</div>
				<template v-else>
					<div class="text-p-base text-ink-gray-7">
						<span class="font-semibold text-ink-gray-9">
							{{ courseSummary.mastered }} {{ __('of') }} {{ courseSummary.total }}
						</span>
						{{ __('concepts mastered') }},
						<span class="font-semibold text-ink-gray-9">
							{{ courseSummary.needs_work }}
						</span>
						{{ __('need work') }}
					</div>

					<div
						v-if="recommended"
						class="flex flex-col md:flex-row md:items-center justify-between gap-3 border rounded-md px-4 py-3"
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

					<div
						v-if="courseConcepts.length"
						class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
					>
						<Tooltip
							v-for="concept in courseConcepts"
							:key="concept.id"
							:text="evidenceText(concept.evidence_count)"
							:hoverDelay="0.3"
						>
							<div
								class="border rounded-md p-3 h-full flex flex-col justify-between gap-3"
							>
								<div
									class="text-p-sm text-ink-gray-8 leading-5 min-h-10 line-clamp-2"
								>
									{{ concept.label }}
								</div>
								<MasteryBar
									:value="concept.p_known"
									:evidence="concept.evidence_count"
								/>
							</div>
						</Tooltip>
					</div>
					<div v-else class="text-p-base text-ink-gray-5">
						{{ __('No concepts recorded for this course yet.') }}
					</div>

					<div v-if="fixList.length" class="space-y-3">
						<h2 class="text-lg-semibold text-ink-gray-9">
							{{ __('What to fix') }}
						</h2>
						<div class="border rounded-md overflow-x-auto">
							<table class="w-full text-start">
								<thead>
									<tr class="border-b bg-surface-gray-1">
										<th
											v-for="column in fixColumns"
											:key="column"
											class="px-4 py-2.5 text-start text-p-sm font-medium text-ink-gray-6"
										>
											{{ column }}
										</th>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="row in fixList"
										:key="row.id"
										class="border-b last:border-b-0 bg-surface-amber-1"
									>
										<td class="px-4 py-3 text-p-base text-ink-gray-8">
											{{ row.label }}
										</td>
										<td class="px-4 py-3 w-56">
											<MasteryBar
												:value="row.p_known"
												:evidence="row.evidence_count"
											/>
										</td>
										<td class="px-4 py-3 text-p-sm">
											<router-link
												v-if="fixRoute(row.fix)"
												:to="fixRoute(row.fix)"
												class="text-ink-gray-8 underline underline-offset-2 hover:text-ink-gray-9"
											>
												{{ row.fix?.title }}
											</router-link>
											<span v-else class="text-ink-gray-5">-</span>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<div class="text-p-sm text-ink-gray-5">
						{{ __('This is advisory. Every lesson stays open.') }}
					</div>
				</template>
			</template>

			<!-- All courses: the flat table of everything with evidence. -->
			<template v-else>
				<div class="text-p-base text-ink-gray-7">
					<span class="font-semibold text-ink-gray-9">
						{{ summary.mastered }} {{ __('of') }} {{ summary.total }}
					</span>
					{{ __('concepts mastered') }},
					<span class="font-semibold text-ink-gray-9">
						{{ summary.needs_work }}
					</span>
					{{ __('need work') }}
				</div>

				<div v-if="rows.length" class="border rounded-md overflow-x-auto">
					<table class="w-full text-start">
						<thead>
							<tr class="border-b bg-surface-gray-1">
								<th
									v-for="column in columns"
									:key="column"
									class="px-4 py-2.5 text-start text-p-sm font-medium text-ink-gray-6"
								>
									{{ column }}
								</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="row in rows"
								:key="row.concept"
								class="border-b last:border-b-0"
								:class="row.evidence_count && needsWork(row.p_known) ? 'bg-surface-amber-1' : ''"
							>
								<td class="px-4 py-3 text-p-base text-ink-gray-8">
									{{ row.label }}
								</td>
								<td class="px-4 py-3 text-p-sm text-ink-gray-6">
									{{ row.track || '-' }}
								</td>
								<td class="px-4 py-3 w-56">
									<MasteryBar :value="row.p_known" :evidence="row.evidence_count" />
								</td>
								<td class="px-4 py-3 text-p-sm">
									<router-link
										v-if="fixRoute(row.fix)"
										:to="fixRoute(row.fix)"
										class="text-ink-gray-8 underline underline-offset-2 hover:text-ink-gray-9"
									>
										{{ row.fix?.title }}
									</router-link>
									<span v-else class="text-ink-gray-5">-</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<div v-else class="text-p-base text-ink-gray-5">
					{{ __('No concepts recorded yet. Work through a lesson to start one.') }}
				</div>
			</template>

			<div class="text-p-sm text-ink-gray-5">
				{{ __('Benches and paired machines live under') }}
				<router-link
					:to="{ name: 'Devices' }"
					class="text-ink-gray-8 underline underline-offset-2 hover:text-ink-gray-9"
				>
					{{ __('Devices') }}
				</router-link>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
	Button,
	FormControl,
	LoadingIndicator,
	Tooltip,
	createResource,
	usePageMeta,
} from 'frappe-ui'
import PageHeader from '@/components/Layouts/PageHeader.vue'
import MasteryBar from '@/components/Tutoring/MasteryBar.vue'
import {
	courseFixList,
	lessonRouteParams,
	masterySummary,
	needsWork,
	pickProgressCourse,
	progressCourseOptions,
} from '@/utils/tutoring'
import type {
	CourseRecommendation,
	FixIt,
	LessonConceptRow,
} from '@/utils/tutoring'
import { sessionStore } from '@/stores/session'

interface ProgressRow {
	concept: string
	label: string
	track?: string
	evidence_count?: number
	p_known: number
	fix?: FixIt | null
}

const { brand } = sessionStore() as { brand: { favicon?: string } }
const route = useRoute()
const router = useRouter()

// Answers {enabled: false} wherever no tutoring app is installed, and the page
// says so rather than showing an empty table.
const progress = createResource({
	url: 'lms.lms.tutoring.learner_progress',
	auto: true,
	onSuccess(data: { courses?: { course: string }[] }) {
		selectedCourse.value = pickProgressCourse(data?.courses, route.query.course)
	},
})

// The course the page is looking at; '' is the flat table across all of
// them. Kept in the URL so a link from a course or lesson page lands here.
const selectedCourse = ref<string>('')

const course = createResource({
	url: 'lms.lms.tutoring.course_progress',
	makeParams() {
		return { course: selectedCourse.value }
	},
	auto: false,
})

watch(selectedCourse, (name) => {
	const query = name ? { course: name } : {}
	if ((route.query.course || '') !== name) router.replace({ query })
	if (name) course.fetch()
})

const summary = computed(
	() => progress.data?.summary || { mastered: 0, total: 0, needs_work: 0 }
)

const rows = computed<ProgressRow[]>(() => progress.data?.rows || [])

const courseOptions = computed(() =>
	progressCourseOptions(progress.data?.courses, __('All courses'))
)

const courseConcepts = computed<LessonConceptRow[]>(
	() => course.data?.concepts || []
)
const courseSummary = computed(() => masterySummary(courseConcepts.value))
const fixList = computed(() => courseFixList(courseConcepts.value, rows.value))

const recommended = computed<CourseRecommendation | null>(
	() => course.data?.recommended || null
)

// Lesson titles repeat across chapters ("Overview"), so the chapter leads.
const recommendedLabel = computed<string>(() => {
	const r = recommended.value
	if (!r) return ''
	return r.chapter_title ? `${r.chapter_title}, ${r.title}` : r.title
})

const recommendedRoute = computed(() => {
	const params = lessonRouteParams(selectedCourse.value, recommended.value?.lesson)
	if (!params) return null
	return { name: 'Lesson', params }
})

const columns = computed(() => [
	__('Concept'),
	__('Track'),
	__('Mastery'),
	__('Fix it with'),
])

const fixColumns = computed(() => [__('Concept'), __('Mastery'), __('Fix it with')])

const fixRoute = (fix: FixIt | null | undefined) => {
	if (!fix?.lesson || !fix?.course) return null
	const params = lessonRouteParams(fix.course, fix.lesson)
	if (!params) return null
	return { name: 'Lesson', params }
}

const evidenceText = (count: number | undefined): string => {
	const n = count || 0
	if (!n) return __('No evidence yet')
	return `${n} ${n === 1 ? __('piece of evidence') : __('pieces of evidence')}`
}

const breadcrumbs = computed(() => [
	{
		label: __('My Progress'),
		route: { name: 'Progress' },
	},
])

usePageMeta(() => {
	return {
		title: __('My Progress'),
		icon: brand?.favicon,
	}
})
</script>
