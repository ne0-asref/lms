<template>
	<div class="w-full p-5">
		<div class="mx-auto max-w-4xl space-y-10 py-6">
			<div class="space-y-4">
				<div v-if="safeUrl(logo)" class="flex justify-center">
					<img
						:src="safeUrl(logo)"
						:alt="branding.data?.app_name || ''"
						class="h-10 w-auto"
					/>
				</div>
				<h1
					v-if="home.data?.title"
					class="text-center text-2xl font-semibold text-ink-gray-9"
				>
					{{ home.data.title }}
				</h1>
			</div>

			<div
				v-if="home.loading && !home.data"
				class="flex items-center justify-center py-20"
			>
				<LoadingIndicator class="size-5 text-ink-gray-5" />
			</div>

			<template v-else>
				<section
					v-if="home.data?.welcome_html"
					v-safe-html:rich="home.data.welcome_html"
					class="ProseMirror prose prose-sm max-w-none"
				/>

				<section v-if="home.data?.updates_html" class="space-y-3">
					<h2 class="text-lg font-semibold text-ink-gray-9">
						{{ __('Latest updates') }}
					</h2>
					<div
						v-safe-html:rich="home.data.updates_html"
						class="ProseMirror prose prose-sm max-w-none"
					/>
				</section>

				<section v-if="programs.length || home.data?.courses_html" class="space-y-3">
					<h2 class="text-lg font-semibold text-ink-gray-9">
						{{ __('Courses') }}
					</h2>
					<div
						v-if="home.data?.courses_html"
						v-safe-html:rich="home.data.courses_html"
						class="ProseMirror prose prose-sm max-w-none"
					/>
					<p v-if="home.data?.preview" class="text-sm text-ink-gray-5">
						{{ __('Drafts are shown to moderators only.') }}
					</p>
					<div v-if="programs.length" class="divide-y rounded-md border">
						<div
							v-for="program in programs"
							:key="program.name"
							class="flex items-start gap-4 p-4"
						>
							<img
								v-if="safeUrl(program.image)"
								:src="safeUrl(program.image)"
								alt=""
								class="size-10 shrink-0 rounded-md object-contain"
							/>
							<span
								v-else
								class="lucide-cpu size-10 shrink-0 rounded-md p-2 text-ink-gray-5 bg-surface-gray-2"
							/>
							<div class="min-w-0 flex-1 space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-base font-medium text-ink-gray-9">
										{{ program.title }}
									</span>
									<Badge v-if="!program.published" theme="gray">
										{{ __('Draft') }}
									</Badge>
									<Badge v-if="program.all_free" theme="green">
										{{ __('Free') }}
									</Badge>
									<Badge v-if="program.virtual_hardware" theme="blue">
										{{ __('Virtual hardware') }}
									</Badge>
									<Badge v-if="program.offers_certificate" theme="orange">
										<span class="lucide-award size-3 me-1" />
										{{ __('Certificate') }}
									</Badge>
								</div>
								<p v-if="program.description" class="text-sm text-ink-gray-6">
									{{ program.description }}
								</p>
								<p class="text-sm text-ink-gray-5">
									<span>{{ courseCount(program.course_count) }}</span>
									<template v-if="program.courses.length">
										<span> &middot; </span>
										<template v-for="(course, i) in program.courses" :key="course.name">
											<router-link
												:to="{
													name: 'CourseDetail',
													params: { courseName: course.name },
												}"
												class="hover:text-ink-gray-9"
											>
												{{ course.title }}<template v-if="!course.published"> ({{ __('draft') }})</template>
											</router-link><span v-if="i < program.courses.length - 1">, </span>
										</template>
									</template>
								</p>
							</div>
							<router-link
								:to="{
									name: 'ProgramDetail',
									params: { programName: program.name },
								}"
								class="shrink-0 text-sm text-ink-gray-6 hover:text-ink-gray-9"
							>
								{{ __('See path') }} &rarr;
							</router-link>
						</div>
					</div>
				</section>

				<section v-if="upcoming.length" class="space-y-3">
					<h2 class="text-lg font-semibold text-ink-gray-9">
						{{ __('Coming soon') }}
					</h2>
					<div class="divide-y rounded-md border">
						<div v-for="course in upcoming" :key="course.name" class="p-4">
							<div class="text-base font-medium text-ink-gray-9">
								{{ course.title }}
							</div>
							<div
								v-if="course.short_introduction"
								class="mt-1 text-sm text-ink-gray-6"
							>
								{{ course.short_introduction }}
							</div>
						</div>
					</div>
				</section>
			</template>
		</div>
	</div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { Badge, createResource, LoadingIndicator, usePageMeta } from 'frappe-ui'
import { sessionStore } from '@/stores/session'
import { safeUrl } from '@/utils/safeUrl'

// The whole page in one call: it is the first screen a visitor sees, and a
// section per request would have it assembling itself in front of them.
const home = createResource({
	url: 'lms.lms.api.get_home_page',
	auto: true,
})

const { brand, branding } = sessionStore()

// `app_logo` is the site's own mark; `banner_image` is what BrandSettings
// writes alongside it. Neither set is a real answer — the page just opens on
// its own words rather than on a placeholder.
const logo = computed(
	() =>
		branding.data?.app_logo?.file_url || branding.data?.banner_image?.file_url
)

const programs = computed(() => home.data?.programs || [])
const upcoming = computed(() => home.data?.upcoming || [])

const courseCount = (count: number) =>
	count === 1 ? __('1 course') : __('{0} courses').format(count)

usePageMeta(() => {
	return {
		title: __('Home'),
		icon: brand.favicon,
	}
})
</script>
