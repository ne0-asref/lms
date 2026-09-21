import { describe, expect, it } from 'vitest'
import {
	benchStatus,
	benchStatusTheme,
	normaliseShareCode,
	sharedBenches,
	coursesWithRecommendation,
	firstFailureText,
	lessonRouteParams,
	masteryLabel,
	masteryPercent,
	masteryTone,
	needsWork,
	runPassed,
	runStatusText,
} from '@/utils/tutoring'

describe('mastery formatting', () => {
	it('renders 0..1 as a whole percent', () => {
		expect(masteryPercent(0)).toBe(0)
		expect(masteryPercent(0.92)).toBe(92)
		expect(masteryPercent(1)).toBe(100)
		expect(masteryLabel(0.405)).toBe('41%')
	})

	it('clamps anything outside 0..1, including junk', () => {
		expect(masteryPercent(-3)).toBe(0)
		expect(masteryPercent(7)).toBe(100)
		expect(masteryPercent(null)).toBe(0)
		expect(masteryPercent(undefined)).toBe(0)
		expect(masteryPercent('0.5')).toBe(50)
	})

	it('puts the amber threshold at 0.5, amber below it only', () => {
		expect(needsWork(0.49)).toBe(true)
		expect(needsWork(0.5)).toBe(false)
		expect(needsWork(0.51)).toBe(false)
		expect(masteryTone(0.3)).toBe('amber')
		expect(masteryTone(0.5)).toBe('green')
	})
})

describe('firstFailureText', () => {
	it('reads both sides of a failure', () => {
		expect(firstFailureText({ expected: 'high', observed: 'low' })).toBe(
			'expected high, observed low'
		)
	})

	it('parses the JSON string the run record stores', () => {
		expect(firstFailureText('{"expected": "3.3 V", "observed": "0 V"}')).toBe(
			'expected 3.3 V, observed 0 V'
		)
	})

	it('keeps whatever one side it has', () => {
		expect(firstFailureText({ expected: 'a pulse' })).toBe('expected a pulse')
		expect(firstFailureText({ observed: 'silence' })).toBe('observed silence')
	})

	it('says nothing when there is nothing to say', () => {
		expect(firstFailureText(null)).toBe('')
		expect(firstFailureText('')).toBe('')
		expect(firstFailureText({})).toBe('')
	})

	it('falls back to the raw string when it is not JSON', () => {
		expect(firstFailureText('pin 13 never went high')).toBe(
			'pin 13 never went high'
		)
	})
})

describe('runStatusText', () => {
	it('says so when there are no runs', () => {
		expect(runStatusText(null)).toBe('No runs yet')
		expect(runPassed(null)).toBe(false)
	})

	it('needs both the build and the check to call it a pass', () => {
		const run = { build_status: 'passed', check_status: 'passed' }
		expect(runStatusText(run)).toBe('Last run: passed')
		expect(runPassed(run)).toBe(true)
	})

	it('names a build failure before looking at the check', () => {
		expect(
			runStatusText({ build_status: 'failed', check_status: 'not_run' })
		).toBe('Last run: build failed')
	})

	it('carries the failure evidence into the line', () => {
		expect(
			runStatusText({
				build_status: 'passed',
				check_status: 'failed',
				first_failure: { expected: 'high', observed: 'low' },
			})
		).toBe('Last run: failed, expected high, observed low')
	})

	it('does not call a check that never ran a pass', () => {
		const run = { build_status: 'passed', check_status: 'not_run' }
		expect(runStatusText(run)).toBe('Last run: built, check not run')
		expect(runPassed(run)).toBe(false)
	})
})

describe('lessonRouteParams', () => {
	it('splits the chapter and lesson pair', () => {
		expect(lessonRouteParams('rust-101', '3-2')).toEqual({
			courseName: 'rust-101',
			chapterNumber: '3',
			lessonNumber: '2',
		})
	})

	it('refuses anything that is not that pair', () => {
		expect(lessonRouteParams('rust-101', 'chapter-three')).toBeNull()
		expect(lessonRouteParams('rust-101', '')).toBeNull()
		expect(lessonRouteParams('', '3-2')).toBeNull()
		expect(lessonRouteParams('rust-101', null)).toBeNull()
	})
})

describe('coursesWithRecommendation', () => {
	it('keeps only the rows that carry a recommendation', () => {
		const rows = [
			{ course: 'rust-101', recommendation: { lesson: '3-2', title: 'Traits' } },
			{ course: 'rust-201', recommendation: null },
			{ course: 'rust-301' },
		]
		expect(coursesWithRecommendation(rows)).toEqual([rows[0]])
	})

	it('treats missing or non-array input as no rows', () => {
		expect(coursesWithRecommendation(null)).toEqual([])
		expect(coursesWithRecommendation(undefined)).toEqual([])
	})
})

describe('devices page helpers', () => {
	it('normalises bench status to the three the page draws', () => {
		expect(benchStatus('available')).toBe('available')
		expect(benchStatus('busy')).toBe('busy')
		expect(benchStatus(null)).toBe('offline')
		expect(benchStatus('anything else')).toBe('offline')
		expect(benchStatusTheme('available')).toBe('green')
		expect(benchStatusTheme('busy')).toBe('orange')
		expect(benchStatusTheme(undefined)).toBe('gray')
	})

	it('shared benches are the ones with sharing on', () => {
		const mine = [
			{ name: 'a', sharing: true },
			{ name: 'b', sharing: false },
			{ name: 'c' },
		]
		expect(sharedBenches(mine).map((r) => r.name)).toEqual(['a'])
		expect(sharedBenches(null)).toEqual([])
	})

	it('share codes are forgiving about how they were typed', () => {
		expect(normaliseShareCode('wxyz1234')).toBe('WXYZ-1234')
		expect(normaliseShareCode(' wxyz-1234 ')).toBe('WXYZ-1234')
		expect(normaliseShareCode('wx')).toBe('WX')
	})
})
