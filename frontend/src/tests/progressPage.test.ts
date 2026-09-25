import { describe, expect, it } from 'vitest'
import {
	countText,
	courseFixList,
	masterySummary,
	masterySummaryText,
	pickProgressCourse,
	progressCourseOptions,
} from '@/utils/tutoring'

const rows = [
	{ id: 'a', label: 'A', p_known: 0.2, evidence_count: 0 },
	{ id: 'b', label: 'B', p_known: 0.3, evidence_count: 2 },
	{ id: 'c', label: 'C', p_known: 0.95, evidence_count: 4 },
	{ id: 'd', label: 'D', p_known: 0.8, evidence_count: 1 },
]

describe('masterySummary', () => {
	it('counts mastered at the threshold and needs work only with evidence', () => {
		expect(masterySummary(rows)).toEqual({ mastered: 2, needs_work: 1, total: 4 })
	})
	it('is all zeros for nothing', () => {
		expect(masterySummary(undefined)).toEqual({ mastered: 0, needs_work: 0, total: 0 })
	})
	it('reads as one line, with the tail only when something needs work', () => {
		expect(masterySummaryText({ mastered: 2, needs_work: 1, total: 4 })).toBe(
			'2 of 4 concepts mastered, 1 need work'
		)
		expect(masterySummaryText({ mastered: 4, needs_work: 0, total: 4 })).toBe(
			'4 of 4 concepts mastered'
		)
	})
})

const courses = [
	{ course: 'esp-gpio', course_title: 'GPIO' },
	{ course: 'esp-timers' },
]

describe('progressCourseOptions', () => {
	it('lists every course by title, then all courses last', () => {
		expect(progressCourseOptions(courses)).toEqual([
			{ label: 'GPIO', value: 'esp-gpio' },
			{ label: 'esp-timers', value: 'esp-timers' },
			{ label: 'All courses', value: '' },
		])
	})
	it('offers only all courses when there are none', () => {
		expect(progressCourseOptions(null)).toEqual([{ label: 'All courses', value: '' }])
	})
})

describe('pickProgressCourse', () => {
	it('honours a course from the URL that the tutoring covers', () => {
		expect(pickProgressCourse(courses, 'esp-timers')).toBe('esp-timers')
	})
	it('falls back to the first course, then to all courses', () => {
		expect(pickProgressCourse(courses, 'unknown')).toBe('esp-gpio')
		expect(pickProgressCourse(courses, undefined)).toBe('esp-gpio')
		expect(pickProgressCourse([], 'esp-gpio')).toBe('')
	})
})

describe('courseFixList', () => {
	it('keeps the concepts that need work, in course order, with their fix', () => {
		const fixes = [
			{ concept: 'b', fix: { exercise_id: 'x', title: 'Blink', lesson: '1-2', course: 'esp-gpio' } },
			{ concept: 'c', fix: { exercise_id: 'y', title: 'Other', lesson: '1-3', course: 'esp-gpio' } },
		]
		const out = courseFixList(rows, fixes)
		expect(out.map((r) => r.id)).toEqual(['b'])
		expect(out[0].fix?.title).toBe('Blink')
	})
	it('carries a null fix when the rows know of none', () => {
		expect(courseFixList(rows, [])[0].fix).toBeNull()
	})
})

describe('countText', () => {
	it('pluralises and treats a missing count as zero', () => {
		expect(countText(1, 'attempt', 'attempts')).toBe('1 attempt')
		expect(countText(2, 'hint', 'hints')).toBe('2 hints')
		expect(countText(undefined, 'attempt', 'attempts')).toBe('0 attempts')
	})
})
