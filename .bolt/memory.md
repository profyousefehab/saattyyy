# Project memory

## Product intent & audience

- Personal work-shift tracking app for recording workdays, including a fallback workflow when a user forgets to start or end a shift.
- Supports manual entry of a past workday with date, start time, and end time.
- Interface is oriented toward Arabic-speaking users; relevant actions and labels are in Arabic.
- Data is stored locally on the device rather than in Supabase.

## Brand personality & voice

- Practical, clear, and reassuring, especially around correcting missed shift actions.
- Arabic-first user experience with concise labels and direct feedback.
- Production-oriented rather than minimal or prototype-like.

## Visual design & UX direction

- Manual past-day entry is accessed from the work log beneath the month selector.
- The flow should preview the calculated work duration before saving.
- Validation currently covers:
  - Overlap with existing workdays
  - Future dates/times
  - Days already marked as leave
  - Invalid or incomplete time ranges
- Preserve clear confirmation and error states so users can confidently correct missed clock-in/clock-out events.
- The app should remain usable on phone screens; phone-specific testing is still outstanding.
- Home-screen/PWA icon assets are not yet available, so the installed app may display an incorrect or missing icon.

## Decisions, constraints & rationale

- Manual shift entry is the fallback for forgotten shift start or end actions.
- A work entry consists of one day, a start time, and an end time.
- Existing records and leave days must be protected from accidental conflicts.
- Build and type checking currently pass.
- Local device persistence is intentional for the current app behavior; no Supabase integration was added.

## Open questions & assumptions

- Confirm the exact Arabic terminology and whether the manual-entry action should be discoverable elsewhere besides the work log.
- Test the complete manual-entry flow on a physical phone, including keyboard behavior, date/time inputs, validation messages, and save persistence.
- Create and wire the correct home-screen app icon image files.
- Clarify whether overnight shifts crossing midnight are supported; current behavior is assumed to represent a single-day start/end range.