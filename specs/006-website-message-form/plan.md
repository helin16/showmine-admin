# Implementation Plan: Website Message Form

**Branch**: `006-website-message-form` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

## Summary
A `form` block; visitors' messages stored in `websiteMessages` and emailed through the notification queue; a
Messages page for company admins. Order: docs PR, API PR (with the migration), Reader PR, admin PR; each merged
with Lin's OK.

## Technical Context
As spec 004/005. No new dependencies. One migration. Reuses `SecurityHelper.makeLimiter`, the notification queue
(`NotificationQueue.enqueue`), `NotificationHelper` (email with retries and escaping), the Comments list pattern in
the admin, and the article comments' client-side POST pattern in the Reader.

## Constitution Check
Repository impact recorded; admin-only access with tests for allowed and denied roles; company scope on every
query; no secrets; visitor data kept to what the company needs (no IP stored); en/cn labels; keyboard-usable form.
