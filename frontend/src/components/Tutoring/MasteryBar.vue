<template>
	<div class="flex items-center gap-2">
		<span
			class="text-p-sm font-medium tabular-nums"
			:class="masteryTextClass(value)"
		>
			{{ masteryLabel(value) }}
		</span>
		<div class="h-1.5 flex-1 rounded-full bg-surface-gray-3">
			<div
				class="h-1.5 rounded-full"
				:class="masteryFillClass(value)"
				:style="{ width: masteryWidth(value) }"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	masteryFillClass,
	masteryLabel,
	masteryTextClass,
	masteryWidth,
} from '@/utils/tutoring'

defineProps<{
	value: number
}>()
</script>
