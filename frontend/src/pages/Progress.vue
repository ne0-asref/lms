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
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="text-2xl-semibold text-ink-gray-9">
					{{ __('My Progress') }}
				</h1>
			</div>

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
							:class="needsWork(row.p_known) ? 'bg-surface-amber-1' : ''"
						>
							<td class="px-4 py-3 text-p-base text-ink-gray-8">
								{{ row.label }}
							</td>
							<td class="px-4 py-3 text-p-sm text-ink-gray-6">
								{{ row.track || '-' }}
							</td>
							<td class="px-4 py-3 w-56">
								<MasteryBar :value="row.p_known" />
							</td>
							<td class="px-4 py-3 text-p-sm">
								<router-link
									v-if="fixRoute(row)"
									:to="fixRoute(row)"
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

			<section class="space-y-3">
				<h2 class="text-lg-semibold text-ink-gray-9">{{ __('Devices') }}</h2>
				<div v-if="devices.length" class="border rounded-md divide-y">
					<div
						v-for="device in devices"
						:key="device.name"
						class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
					>
						<div>
							<div class="text-p-base text-ink-gray-8">
								{{ device.label || device.name }}
							</div>
							<div class="text-p-sm text-ink-gray-5">
								{{
									device.last_used_at
										? `${__('Last used')} ${dayjs(device.last_used_at).fromNow()}`
										: __('Never used')
								}}
							</div>
						</div>
						<Badge v-if="device.revoked" theme="gray">
							{{ __('Revoked') }}
						</Badge>
						<Button
							v-else
							theme="red"
							variant="subtle"
							:loading="revoking === device.name"
							@click="revoke(device)"
						>
							{{ __('Revoke') }}
						</Button>
					</div>
				</div>
				<div v-else class="text-p-base text-ink-gray-5">
					{{ __('No devices paired with this account.') }}
				</div>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
	Badge,
	Button,
	LoadingIndicator,
	call,
	createResource,
	toast,
	usePageMeta,
} from 'frappe-ui'
import PageHeader from '@/components/Layouts/PageHeader.vue'
import MasteryBar from '@/components/Tutoring/MasteryBar.vue'
import dayjs from '@/utils/dayjs'
import { lessonRouteParams, needsWork } from '@/utils/tutoring'
import { sessionStore } from '@/stores/session'

interface FixIt {
	exercise_id?: string
	title?: string
	lesson?: string
	course?: string
}

interface ProgressRow {
	concept: string
	label: string
	track?: string
	p_known: number
	fix?: FixIt | null
}

interface Device {
	name: string
	label?: string
	last_used_at?: string
	revoked?: boolean
}

const { brand } = sessionStore() as { brand: { favicon?: string } }
const revoking = ref('')

// Answers {enabled: false} wherever no tutoring app is installed, and the page
// says so rather than showing an empty table.
const progress = createResource({
	url: 'lms.lms.tutoring.learner_progress',
	auto: true,
})

const summary = computed(
	() => progress.data?.summary || { mastered: 0, total: 0, needs_work: 0 }
)

const rows = computed<ProgressRow[]>(() => progress.data?.rows || [])
const devices = computed<Device[]>(() => progress.data?.devices || [])

const columns = computed(() => [
	__('Concept'),
	__('Track'),
	__('Mastery'),
	__('Fix it with'),
])

const fixRoute = (row: ProgressRow) => {
	if (!row.fix?.lesson || !row.fix?.course) return null
	const params = lessonRouteParams(row.fix.course, row.fix.lesson)
	if (!params) return null
	return { name: 'Lesson', params }
}

const revoke = async (device: Device) => {
	revoking.value = device.name
	try {
		await call('lms.lms.tutoring.revoke_device', { name: device.name })
		progress.reload()
	} catch (error) {
		toast.error(__('Could not revoke that device.'))
	} finally {
		revoking.value = ''
	}
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
