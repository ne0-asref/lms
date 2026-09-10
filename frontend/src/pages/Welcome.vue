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

				<section v-if="groups.length" class="space-y-3">
					<h2 class="text-lg font-semibold text-ink-gray-9">
						{{ __('Courses') }}
					</h2>
					<p v-if="home.data?.preview" class="text-sm text-ink-gray-5">
						{{ __('Drafts are shown to moderators only; visitors see published courses.') }}
					</p>
					<div class="divide-y rounded-md border">
						<div v-for="group in groups" :key="group.name" class="space-y-3 p-4">
							<div class="flex items-baseline justify-between gap-4">
								<div class="flex items-baseline gap-2">
									<span class="text-base font-medium text-ink-gray-9">
										{{ group.name }}
									</span>
									<span class="text-sm text-ink-gray-5">
										{{ courseCount(group.count) }}
									</span>
								</div>
								<router-link
									v-if="home.data?.has_programs"
									:to="{ name: 'Programs' }"
									class="shrink-0 text-sm text-ink-gray-6 hover:text-ink-gray-9"
								>
									{{ __('See learning paths') }} &rarr;
								</router-link>
							</div>

							<div class="flex flex-wrap gap-2">
								<router-link
									v-for="course in group.courses"
									:key="course.name"
									:to="{
										name: 'CourseDetail',
										params: { courseName: course.name },
									}"
									class="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm text-ink-gray-8 hover:border-outline-gray-3"
								>
									<span>{{ course.title }}</span>
									<Badge v-if="!course.published" theme="gray">
										{{ __('Draft') }}
									</Badge>
									<Badge
										:theme="course.disable_self_learning ? 'blue' : 'green'"
									>
										{{
											course.disable_self_learning
												? __('Members')
												: __('Free')
										}}
									</Badge>
									<span
										v-if="course.enable_certification"
										class="lucide-award size-4 shrink-0 text-ink-gray-5"
										:title="__('Certificate on completion')"
									/>
								</router-link>
							</div>
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

const groups = computed(() => home.data?.groups || [])
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
