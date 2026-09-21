<template>
	<div>
		<PageHeader :breadcrumbs="breadcrumbs" />

		<div
			v-if="devices.loading && !devices.data"
			class="flex flex-1 items-center justify-center p-5"
		>
			<LoadingIndicator class="size-5 text-ink-gray-5" />
		</div>

		<div
			v-else-if="!devices.data?.enabled"
			class="p-5 max-w-3xl mx-auto text-center space-y-2 mt-10"
		>
			<div class="text-lg-semibold text-ink-gray-8">
				{{ __('Devices are not enabled on this site.') }}
			</div>
			<div class="text-p-base text-ink-gray-5">
				{{
					__(
						'Once they are, this page lists the boards you serve, the ones you share, and the ones you connect to.'
					)
				}}
			</div>
		</div>

		<div v-else class="p-5 space-y-8">
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="text-2xl-semibold text-ink-gray-9">
					{{ __('Devices') }}
				</h1>
			</div>

			<!-- Connect to a bench -->
			<section class="space-y-3">
				<h2 class="text-lg-semibold text-ink-gray-9">
					{{ __('Connect to a bench') }}
				</h2>
				<div class="text-p-base text-ink-gray-6">
					{{
						__(
							'Enter the share code the bench owner gave you. The bench is added to the list below and you are connected to it.'
						)
					}}
				</div>
				<form class="flex flex-wrap items-center gap-2" @submit.prevent="connect">
					<FormControl
						v-model="code"
						type="text"
						class="w-48"
						:placeholder="__('WXYZ-1234')"
						autocomplete="off"
					/>
					<Button
						variant="solid"
						:loading="busy === 'connect'"
						:disabled="!code.trim()"
						@click="connect"
					>
						{{ __('Connect') }}
					</Button>
				</form>
			</section>

			<!-- Mine -->
			<section class="space-y-3">
				<h2 class="text-lg-semibold text-ink-gray-9">{{ __('Mine') }}</h2>
				<div class="text-p-sm text-ink-gray-5">
					{{ __('Benches you serve from your own machine.') }}
				</div>
				<div v-if="mine.length" class="border rounded-md divide-y">
					<div
						v-for="bench in mine"
						:key="bench.name"
						class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
					>
						<div class="space-y-0.5">
							<div class="flex items-center gap-2">
								<span class="text-p-base text-ink-gray-8 font-medium">
									{{ bench.label || bench.board }}
								</span>
								<Badge :theme="benchStatusTheme(bench.status)">
									{{ statusLabel(bench.status) }}
								</Badge>
							</div>
							<div class="text-p-sm text-ink-gray-5">
								{{ bench.board }}
								<span v-if="bench.last_seen">
									&middot; {{ __('Last seen') }}
									{{ dayjs(bench.last_seen).fromNow() }}
								</span>
								<span v-else>&middot; {{ __('Never seen') }}</span>
								<span v-if="bench.sharing">
									&middot; {{ __('Shared with') }}
									{{ connectedText(bench) }}
								</span>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<Button
								v-if="bench.sharing"
								variant="subtle"
								:loading="busy === `unshare:${bench.name}`"
								@click="unshare(bench)"
							>
								{{ __('Stop sharing') }}
							</Button>
							<Button
								v-else
								variant="subtle"
								:loading="busy === `share:${bench.name}`"
								@click="share(bench)"
							>
								{{ __('Share') }}
							</Button>
							<Button
								theme="red"
								variant="subtle"
								:loading="busy === `remove:${bench.name}`"
								@click="remove(bench)"
							>
								{{ __('Remove') }}
							</Button>
						</div>
					</div>
				</div>
				<div v-else class="text-p-base text-ink-gray-5">
					{{ __('No benches yet. Serve one from your machine and it shows up here.') }}
				</div>
			</section>

			<!-- Shared with others -->
			<section class="space-y-3">
				<h2 class="text-lg-semibold text-ink-gray-9">
					{{ __('Shared with others') }}
				</h2>
				<div class="text-p-sm text-ink-gray-5">
					{{ __('Read the code out; anyone who enters it can drive the bench.') }}
				</div>
				<div v-if="shared.length" class="border rounded-md divide-y">
					<div
						v-for="bench in shared"
						:key="bench.name"
						class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
					>
						<div class="space-y-0.5">
							<div class="flex items-center gap-2">
								<span class="text-p-base text-ink-gray-8 font-medium">
									{{ bench.label || bench.board }}
								</span>
								<code class="text-p-sm px-1.5 py-0.5 rounded bg-surface-gray-2 text-ink-gray-8">
									{{ bench.share_code }}
								</code>
							</div>
							<div class="text-p-sm text-ink-gray-5">
								{{ __('Connected now') }}: {{ connectedText(bench) }}
							</div>
						</div>
						<Button
							theme="red"
							variant="subtle"
							:loading="busy === `unshare:${bench.name}`"
							@click="unshare(bench)"
						>
							{{ __('Stop sharing and drop everyone') }}
						</Button>
					</div>
				</div>
				<div v-else class="text-p-base text-ink-gray-5">
					{{ __('Nothing shared. Use Share on a bench above.') }}
				</div>
			</section>

			<!-- Using -->
			<section class="space-y-3">
				<h2 class="text-lg-semibold text-ink-gray-9">{{ __('Using') }}</h2>
				<div class="text-p-sm text-ink-gray-5">
					{{ __('Benches you connected to with a share code.') }}
				</div>
				<div v-if="using.length" class="border rounded-md divide-y">
					<div
						v-for="bench in using"
						:key="bench.name"
						class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
					>
						<div class="space-y-0.5">
							<div class="flex items-center gap-2">
								<span class="text-p-base text-ink-gray-8 font-medium">
									{{ bench.label || bench.board }}
								</span>
								<Badge :theme="benchStatusTheme(bench.status)">
									{{ statusLabel(bench.status) }}
								</Badge>
								<Badge v-if="bench.connected" theme="blue">
									{{ __('Connected') }}
								</Badge>
							</div>
							<div class="text-p-sm text-ink-gray-5">
								{{ bench.board }} &middot; {{ __('Owner') }}:
								{{ bench.own ? __('you') : bench.owner_name }}
								<span v-if="!bench.sharing && !bench.own">
									&middot; {{ __('No longer shared') }}
								</span>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<Button
								v-if="bench.connected"
								variant="subtle"
								:loading="busy === `disconnect:${bench.name}`"
								@click="disconnect(bench)"
							>
								{{ __('Disconnect') }}
							</Button>
							<Button
								v-else
								variant="subtle"
								:disabled="!bench.sharing && !bench.own"
								:loading="busy === `reconnect:${bench.name}`"
								@click="reconnect(bench)"
							>
								{{ __('Connect') }}
							</Button>
							<Button
								theme="red"
								variant="subtle"
								:loading="busy === `forget:${bench.name}`"
								@click="forget(bench)"
							>
								{{ __('Forget') }}
							</Button>
						</div>
					</div>
				</div>
				<div v-else class="text-p-base text-ink-gray-5">
					{{ __('Not using any bench. Enter a share code above.') }}
				</div>
			</section>

			<!-- Machines allowed to post runs -->
			<section class="space-y-3">
				<h2 class="text-lg-semibold text-ink-gray-9">
					{{ __('Machines allowed to post runs as you') }}
				</h2>
				<div class="text-p-sm text-ink-gray-5">
					{{ __('Each one holds a token you approved. Revoke it and the machine has to pair again. Revoked machines are deleted after 30 days, or delete them now.') }}
				</div>
				<div v-if="tokens.length" class="border rounded-md divide-y">
					<div
						v-for="token in tokens"
						:key="token.name"
						class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
					>
						<div>
							<div class="text-p-base text-ink-gray-8">
								{{ token.label || token.name }}
							</div>
							<div class="text-p-sm text-ink-gray-5">
								{{ tokenNote(token) }}
							</div>
						</div>
						<div class="flex items-center gap-2">
							<Badge v-if="token.revoked" theme="gray">
								{{ __('Revoked') }}
							</Badge>
							<Button
								v-if="token.revoked"
								theme="red"
								variant="subtle"
								:loading="busy === `delete:${token.name}`"
								@click="deleteNow(token)"
							>
								{{ __('Delete now') }}
							</Button>
							<Button
								v-else
								theme="red"
								variant="subtle"
								:loading="busy === `revoke:${token.name}`"
								@click="revoke(token)"
							>
								{{ __('Revoke') }}
							</Button>
						</div>
					</div>
				</div>
				<div v-else class="text-p-base text-ink-gray-5">
					{{ __('No machines paired with this account.') }}
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
	FormControl,
	LoadingIndicator,
	call,
	createResource,
	toast,
	usePageMeta,
} from 'frappe-ui'
import PageHeader from '@/components/Layouts/PageHeader.vue'
import dayjs from '@/utils/dayjs'
import {
	benchStatus,
	benchStatusTheme,
	normaliseShareCode,
	sharedBenches,
} from '@/utils/tutoring'
import type { BenchRow } from '@/utils/tutoring'
import { sessionStore } from '@/stores/session'

interface UsingRow extends BenchRow {
	owner_name?: string
	own?: boolean
	connected?: boolean
	connected_at?: string | null
}

interface Token {
	name: string
	label?: string
	last_used_at?: string
	revoked?: boolean
	delete_at?: string
}

const { brand } = sessionStore() as { brand: { favicon?: string } }
const busy = ref('')
const code = ref('')

// Answers {enabled: false} wherever no tutoring app is installed, and the page
// says so rather than showing three empty lists.
const devices = createResource({
	url: 'lms.lms.tutoring.devices',
	auto: true,
})

const mine = computed<BenchRow[]>(() => devices.data?.mine || [])
const shared = computed<BenchRow[]>(() => sharedBenches(mine.value))
const using = computed<UsingRow[]>(() => devices.data?.using || [])
const tokens = computed<Token[]>(() => devices.data?.tokens || [])

const statusLabel = (status: unknown) => {
	const s = benchStatus(status)
	if (s === 'available') return __('Available')
	if (s === 'busy') return __('Busy')
	return __('Offline')
}

const connectedText = (bench: BenchRow) => {
	const names = Array.isArray(bench.connected) ? bench.connected : []
	return names.length ? names.join(', ') : __('nobody')
}

// Every action goes through here: one endpoint, one argument, one failure
// message, then the page reloads so the lists reflect the server.
const act = async (
	key: string,
	method: string,
	args: Record<string, string>,
	failure: string
) => {
	busy.value = key
	try {
		const result = await call(`lms.lms.tutoring.${method}`, args)
		if (result?.error) {
			toast.error(result.error.message || failure)
			return null
		}
		devices.reload()
		return result
	} catch (error) {
		toast.error(failure)
		return null
	} finally {
		busy.value = ''
	}
}

const connect = async () => {
	const normalised = normaliseShareCode(code.value)
	if (!normalised) return
	const result = await act(
		'connect',
		'bench_connect',
		{ code: normalised },
		__('No bench is sharing under that code.')
	)
	if (result) {
		code.value = ''
		toast.success(__('Connected to {0}.').format(result.label || result.board))
	}
}

const share = (bench: BenchRow) =>
	act(`share:${bench.name}`, 'bench_share', { bench: bench.name }, __('Could not share that bench.'))
const unshare = (bench: BenchRow) =>
	act(`unshare:${bench.name}`, 'bench_unshare', { bench: bench.name }, __('Could not stop sharing.'))
const remove = (bench: BenchRow) =>
	act(`remove:${bench.name}`, 'bench_remove', { bench: bench.name }, __('Could not remove that bench.'))
const reconnect = (bench: UsingRow) =>
	act(`reconnect:${bench.name}`, 'bench_reconnect', { bench: bench.name }, __('Could not connect.'))
const disconnect = (bench: UsingRow) =>
	act(`disconnect:${bench.name}`, 'bench_disconnect', { bench: bench.name }, __('Could not disconnect.'))
const forget = (bench: UsingRow) =>
	act(`forget:${bench.name}`, 'bench_forget', { bench: bench.name }, __('Could not forget that bench.'))
const revoke = (token: Token) =>
	act(`revoke:${token.name}`, 'revoke_device', { name: token.name }, __('Could not revoke that device.'))
const deleteNow = (token: Token) =>
	act(`delete:${token.name}`, 'delete_device', { name: token.name }, __('Could not delete that device.'))

// Active: when it last posted. Revoked: how long until the row is deleted.
const tokenNote = (token: Token) => {
	if (token.revoked) {
		return token.delete_at
			? `${__('Deleted')} ${dayjs(token.delete_at).fromNow()}`
			: __('Deleted soon')
	}
	return token.last_used_at
		? `${__('Last used')} ${dayjs(token.last_used_at).fromNow()}`
		: __('Never used')
}

const breadcrumbs = computed(() => [
	{
		label: __('Devices'),
		route: { name: 'Devices' },
	},
])

usePageMeta(() => {
	return {
		title: __('Devices'),
		icon: brand?.favicon,
	}
})
</script>
