"""Optional tutoring layer for the LMS.

Every method in this module is whitelisted and answers `{"enabled": False}`.
That is deliberate. The frontend (course page strip, lesson exercise card,
code editor, "My Progress" page) calls these endpoints on every site, and a
site with no tutoring backend installed must answer cleanly rather than throw
a "method not found" at the browser. When `enabled` is false the frontend
renders nothing.

A site that wants tutoring installs an app that implements the same call
signatures and points these paths at its own functions from its `hooks.py`:

        override_whitelisted_methods = {
                "lms.lms.tutoring.course_progress": "my_app.api.course_progress",
                "lms.lms.tutoring.exercise_status": "my_app.api.exercise_status",
                "lms.lms.tutoring.learner_progress": "my_app.api.learner_progress",
                "lms.lms.tutoring.exercise_files": "my_app.api.exercise_files",
                "lms.lms.tutoring.hint": "my_app.api.hint",
                "lms.lms.tutoring.revoke_device": "my_app.api.revoke_device",
        }

The override applies to requests routed through `/api/method/...`, which is how
the frontend reaches them, so the frontend never learns the name of the app
that answers. Each docstring below records the shape an implementation is
expected to return, so a replacement stays drop-in.
"""

import frappe

DISABLED = {"enabled": False}


@frappe.whitelist()
def course_progress(course=None):
	"""Mastery across the concepts a course teaches, plus one recommended lesson.

	An implementation returns::

	        {
	                "enabled": True,
	                "concepts": [{"id", "label", "p_known", "evidence_count"}, ...],
	                "recommended": {"lesson", "title", "reason"} or None,
	        }

	`p_known` is a float from 0 to 1. `lesson` is the route the Start button
	sends the learner to, as "<chapter number>-<lesson number>".
	"""
	return dict(DISABLED)


@frappe.whitelist()
def exercise_status(lesson=None):
	"""Attempts, hints and last run for the exercise attached to a lesson.

	An implementation returns::

	        {
	                "enabled": True,
	                "exercise_id": str,
	                "modes": ["hardware", "simulation"] (optional),
	                "attempts": int,
	                "hints_used": int,
	                "last": {
	                        "name", "build_status", "check_status", "target", "mode",
	                        "compiler_tail", "received_at",
	                        "first_failure": {"expected", "observed"} or None,
	                } or None,
	        }

	`modes` is optional and, when present, lists which ways this exercise may
	be run. The frontend editor is shown only when "simulation" is in it; an
	implementation that omits the key is treated as allowing both.
	"""
	return dict(DISABLED)


@frappe.whitelist()
def learner_progress():
	"""Every concept the current learner has evidence for, across all courses.

	An implementation returns::

	        {
	                "enabled": True,
	                "summary": {"mastered": int, "total": int, "needs_work": int},
	                "rows": [{
	                        "concept", "label", "track", "p_known",
	                        "fix": {"exercise_id", "title", "lesson", "course"} or None,
	                }, ...],
	                "devices": [{"name", "label", "last_used_at", "revoked"}, ...],
	        }
	"""
	return dict(DISABLED)


@frappe.whitelist()
def exercise_files(lesson=None):
	"""Starter files for the exercise attached to a lesson.

	An implementation returns::

	        {
	                "enabled": True,
	                "exercise_id": str,
	                "target": str,
	                "modes": ["hardware", "simulation"] (optional),
	                "instructions_md": str,
	                "files": [{"path": str, "content": str}, ...],
	        }

	An empty `files` list means the exercise is not editable in the browser,
	and the lesson page shows the status card without an editor. `modes`, when
	present and missing "simulation", does the same, and is optional for the
	same reason as in `exercise_status`.
	"""
	return dict(DISABLED)


@frappe.whitelist()
def hint(run=None, files=None):
	"""One hint for a run, for the learner who owns it.

	An implementation returns `{"enabled": True, "number": int, "text": str,
	"exhausted": bool}`. `number` counts hints already spent on the attempt, so
	the page can label them. `files` is the learner's current buffer, which may
	be ahead of what the run was built from.
	"""
	return {"enabled": False, "text": ""}


@frappe.whitelist()
def revoke_device(name=None):
	"""Revoke one of the current learner's paired devices.

	An implementation returns `{"enabled": True, "revoked": True}` and refuses
	any device that does not belong to the session user.
	"""
	return dict(DISABLED)
