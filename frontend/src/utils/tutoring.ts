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

export interface CourseRecommendation {
	lesson: string
	title: string
	chapter_title?: string
	reason?: string
}

export interface CourseProgressRow {
	course: string
	course_title?: string
	evidence_count?: number
	recommendation?: CourseRecommendation | null
}

/**
 * Course rows that have somewhere to send the learner back to. The home page
 * strip only ever shows a row that carries a recommendation, so this is the
 * one filter both the strip and its tests need to agree on.
 */
export function coursesWithRecommendation(
	courses: CourseProgressRow[] | null | undefined
): CourseProgressRow[] {
	if (!Array.isArray(courses)) return []
	return courses.filter((row) => Boolean(row?.recommendation))
}

// --- Devices page -----------------------------------------------------------

export type BenchStatus = 'available' | 'busy' | 'offline'

export interface BenchRow {
	name: string
	label?: string
	board?: string
	url?: string | null
	status?: string | null
	last_seen?: string | null
	sharing?: boolean
	share_code?: string | null
	connected?: string[] | boolean
}

/** Server status normalised to the three the page knows how to draw. */
export function benchStatus(status: unknown): BenchStatus {
	if (status === 'available' || status === 'busy') return status
	return 'offline'
}

/** Badge theme per status: green available, orange busy, gray offline. */
export function benchStatusTheme(status: unknown): 'green' | 'orange' | 'gray' {
	const s = benchStatus(status)
	if (s === 'available') return 'green'
	if (s === 'busy') return 'orange'
	return 'gray'
}

/** The "Shared with others" list: my benches with sharing on. */
export function sharedBenches<T extends { sharing?: boolean }>(
	mine: T[] | null | undefined
): T[] {
	if (!Array.isArray(mine)) return []
	return mine.filter((row) => Boolean(row?.sharing))
}

/** Share codes are typed by hand; keep letters, digits and one dash. */
export function normaliseShareCode(raw: unknown): string {
	const cleaned = String(raw ?? '')
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '')
	if (cleaned.length !== 8) return cleaned
	return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
}

// --- Lesson concept card ----------------------------------------------------

export interface LessonConceptRow {
	id: string
	label: string
	p_known: number
	evidence_count?: number
}

// The card heading says what the concepts are to this page: what a content
// lesson teaches, or what a checkpoint quiz tests.
export function lessonConceptsHeading(source: unknown): string {
	return source === 'quiz' ? 'This checkpoint tests' : 'Concepts in this lesson'
}

// Concepts with evidence that still sit below the mastery threshold.
export function needsWorkCount(rows: LessonConceptRow[] | null | undefined): number {
	if (!Array.isArray(rows)) return 0
	return rows.filter((r) => Boolean(r?.evidence_count) && needsWork(r.p_known)).length
}
