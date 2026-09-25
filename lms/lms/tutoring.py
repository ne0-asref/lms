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
                "lms.lms.tutoring.lesson_concepts": "my_app.api.lesson_concepts",
                "lms.lms.tutoring.exercise_status": "my_app.api.exercise_status",
                "lms.lms.tutoring.learner_progress": "my_app.api.learner_progress",
                "lms.lms.tutoring.exercise_files": "my_app.api.exercise_files",
                "lms.lms.tutoring.hint": "my_app.api.hint",
                "lms.lms.tutoring.revoke_device": "my_app.api.revoke_device",
                "lms.lms.tutoring.delete_device": "my_app.api.delete_device",
                "lms.lms.tutoring.devices": "my_app.api.devices",
                "lms.lms.tutoring.bench_share": "my_app.api.bench_share",
                "lms.lms.tutoring.bench_unshare": "my_app.api.bench_unshare",
                "lms.lms.tutoring.bench_connect": "my_app.api.bench_connect",
                "lms.lms.tutoring.bench_reconnect": "my_app.api.bench_reconnect",
                "lms.lms.tutoring.bench_disconnect": "my_app.api.bench_disconnect",
                "lms.lms.tutoring.bench_forget": "my_app.api.bench_forget",
                "lms.lms.tutoring.bench_remove": "my_app.api.bench_remove",
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
def lesson_concepts(lesson=None):
	"""The concepts one lesson teaches or, on a checkpoint lesson, tests.

	An implementation returns::

	        {
	                "enabled": True,
	                "source": "lesson" or "quiz",
	                "concepts": [{"id", "label", "p_known", "evidence_count"}, ...],
	        }

	`p_known` is a float from 0 to 1. A lesson that neither tags nor tests a
	concept answers `{"enabled": False}` and the card stays off the page.
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
	                "courses": [{
	                        "course", "course_title", "evidence_count",
	                        "recommendation": {"lesson", "title", "chapter_title", "reason"} or None,
	                }, ...],
	                "devices": [{"name", "label", "last_used_at", "revoked", "delete_at"}, ...],
	        }

	`courses` is one row per course the learner has evidence in, each with at
	most one `recommendation`, the same shape `course_progress` hands its
	`recommended` key. It backs the home page "pick up where you left off"
	strip, which shows only the rows that carry a recommendation. Omitting the
	key is treated the same as an empty list, so a "rows"-only implementation
	stays drop-in; the strip just has nothing to show.
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

	An implementation marks the token revoked and returns `{"ok": True, "name"}`;
	it refuses any device that does not belong to the session user. The row
	stays, with `delete_at` set, until a nightly purge removes it (30 days) or
	the learner calls delete_device.
	"""
	return dict(DISABLED)


@frappe.whitelist()
def delete_device(name=None):
	"""Delete one of the current learner's paired devices now, revoked or not.

	Returns `{"ok": True, "name"}`; refuses devices of other users.
	"""
	return dict(DISABLED)


# --- Devices page -----------------------------------------------------------
#
# A "bench" is a development board served over the network by a learner's own
# tooling. The page lists the benches the learner owns, the ones they share,
# and the ones they connected to with a share code, plus the machines allowed
# to post exercise runs as them. All of it is optional; the page explains
# itself when `devices` answers "not enabled".


@frappe.whitelist()
def devices():
	"""Everything the Devices page shows for the current learner.

	An implementation returns::

	        {
	                "enabled": True,
	                "heartbeat_ttl": int,   # seconds without a heartbeat before "offline"
	                "mine": [{
	                        "name", "label", "board", "url",
	                        "status": "available" | "busy" | "offline",
	                        "last_seen", "sharing": bool, "share_code": str or None,
	                        "connected": [display names of learners connected now],
	                }, ...],
	                "using": [{
	                        "name", "label", "board", "owner_name", "own": bool,
	                        "status", "sharing": bool, "connected": bool, "connected_at",
	                        "url": str or None,   # only while connected
	                }, ...],
	                "tokens": [{"name", "label", "last_used_at", "revoked", "delete_at"}, ...],
	        }

	"Shared with others" is `mine` filtered on `sharing`.
	"""
	return dict(DISABLED)


@frappe.whitelist(methods=["POST"])
def bench_share(bench=None):
	"""Owner turns sharing on. Returns `{"ok": True, "share_code": "WXYZ-1234"}`."""
	return dict(DISABLED)


@frappe.whitelist(methods=["POST"])
def bench_unshare(bench=None):
	"""Owner's kill switch: sharing off, code void, every driver dropped."""
	return dict(DISABLED)


@frappe.whitelist(methods=["POST"])
def bench_connect(code=None):
	"""Enter a share code. Adds the bench to `using` and connects."""
	return dict(DISABLED)


@frappe.whitelist(methods=["POST"])
def bench_reconnect(bench=None):
	"""Connect again to a bench already in `using`, without the code."""
	return dict(DISABLED)


@frappe.whitelist(methods=["POST"])
def bench_disconnect(bench=None):
	"""Drop my session on a bench; it stays in `using`."""
	return dict(DISABLED)


@frappe.whitelist(methods=["POST"])
def bench_forget(bench=None):
	"""Remove a bench from `using`."""
	return dict(DISABLED)


@frappe.whitelist(methods=["POST"])
def bench_remove(bench=None):
	"""Owner deletes a bench and every share on it."""
	return dict(DISABLED)
