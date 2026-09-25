import { describe, expect, it } from 'vitest'
import { lessonConceptsHeading, needsWorkCount } from '@/utils/tutoring'

describe('lessonConceptsHeading', () => {
	it('names the quiz on a checkpoint lesson', () => {
		expect(lessonConceptsHeading('quiz')).toBe('This checkpoint tests')
	})
	it('names the lesson otherwise, including when the source is missing', () => {
		expect(lessonConceptsHeading('lesson')).toBe('Concepts in this lesson')
		expect(lessonConceptsHeading(undefined)).toBe('Concepts in this lesson')
	})
})

describe('needsWorkCount', () => {
	it('counts only concepts with evidence below the threshold', () => {
		expect(
			needsWorkCount([
				{ id: 'a', label: 'A', p_known: 0.2, evidence_count: 0 },
				{ id: 'b', label: 'B', p_known: 0.3, evidence_count: 2 },
				{ id: 'c', label: 'C', p_known: 0.95, evidence_count: 4 },
			])
		).toBe(1)
	})
	it('is zero for nothing', () => {
		expect(needsWorkCount(null)).toBe(0)
		expect(needsWorkCount([])).toBe(0)
	})
})
