// Pure helpers for the tutoring UI. They hold the two rules the strip, the
// exercise card and the progress table all have to agree on: what a mastery
// number looks like, and what a failed run reads as. Kept out of the
// components so both can be tested without mounting anything.

export interface FirstFailure {
	expected?: string | number | null
	observed?: string | number | null
}

export interface LastRun {
	build_status?: string | null
	check_status?: string | null
	first_failure?: FirstFailure | string | null
}

// Below this, a concept is "needs work": the amber treatment everywhere.
export const MASTERY_THRESHOLD = 0.5

function clamp(p: unknown): number {
	const value = typeof p === 'number' ? p : Number(p)
	if (!Number.isFinite(value)) return 0
	if (value <= 0) return 0
	if (value >= 1) return 1
	return value
}

/** 0..1 as a whole percent, 0..100. */
export function masteryPercent(p: unknown): number {
	return Math.round(clamp(p) * 100)
}

/** 0..1 as the label the bars carry, e.g. "40%". */
export function masteryLabel(p: unknown): string {
	return `${masteryPercent(p)}%`
}

/** The width a mastery bar's fill gets. */
export function masteryWidth(p: unknown): string {
	return `${masteryPercent(p)}%`
}

export function needsWork(p: unknown): boolean {
	return clamp(p) < MASTERY_THRESHOLD
}

/** 'amber' under the threshold, 'green' at or above it. */
export function masteryTone(p: unknown): 'amber' | 'green' {
	return needsWork(p) ? 'amber' : 'green'
}

export function masteryTextClass(p: unknown): string {
	return needsWork(p) ? 'text-ink-amber-3' : 'text-ink-green-3'
}

export function masteryFillClass(p: unknown): string {
	return needsWork(p) ? 'bg-surface-amber-2' : 'bg-surface-green-3'
}

function side(value: unknown): string {
	if (value === null || value === undefined || value === '') return ''
	return String(value)
}

/**
 * Reads a first_failure into one line. The record can arrive as an object or
 * as the JSON string the server stores, and either side can be missing.
 * Returns '' when there is nothing to say, so callers can test it directly.
 */
export function firstFailureText(failure: unknown): string {
	let parsed: FirstFailure | null = null
	if (typeof failure === 'string') {
		if (!failure.trim()) return ''
		try {
			parsed = JSON.parse(failure)
		} catch (e) {
			return failure
		}
	} else if (failure && typeof failure === 'object') {
		parsed = failure as FirstFailure
	}
	if (!parsed) return ''
	const expected = side(parsed.expected)
	const observed = side(parsed.observed)
	if (expected && observed) return `expected ${expected}, observed ${observed}`
	if (expected) return `expected ${expected}`
	if (observed) return `observed ${observed}`
	return ''
}

/**
 * The status line at the top of the exercise card. Passing needs both the
 * build and the check to pass; a check that never ran does not count as a
 * pass, so it reads as failed with whatever evidence there is.
 */
export function runStatusText(last: LastRun | null | undefined): string {
	if (!last) return 'No runs yet'
	const build = last.build_status
	const check = last.check_status
	if (build === 'passed' && check === 'passed') return 'Last run: passed'
	if (build === 'failed') return 'Last run: build failed'
	const detail = firstFailureText(last.first_failure)
	if (check === 'not_run') return 'Last run: built, check not run'
	return detail ? `Last run: failed, ${detail}` : 'Last run: failed'
}

/** True when the run is a clean pass, for the badge theme. */
export function runPassed(last: LastRun | null | undefined): boolean {
	return Boolean(last && last.build_status === 'passed' && last.check_status === 'passed')
}

/**
 * The route params for a recommended lesson. The backend hands back the
 * lesson as "<chapter number>-<lesson number>", the same pair the Lesson
 * route carries. Anything else returns null and the caller hides the button
 * rather than pushing a route that cannot resolve.
 */
export function lessonRouteParams(
	courseName: string,
	lesson: unknown
): { courseName: string; chapterNumber: string; lessonNumber: string } | null {
	if (!courseName || typeof lesson !== 'string') return null
	const match = lesson.trim().match(/^(\d+)-(\d+)$/)
	if (!match) return null
	return {
		courseName,
		chapterNumber: match[1],
		lessonNumber: match[2],
	}
}
