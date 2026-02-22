---
name: testing
description: Testing guidelines. Auto-apply when writing or modifying tests. No mocks by default — prefer real implementations and integration tests.
user-invocable: false
---

# Testing Guidelines

## No Mocks by Default

Never use mocks in tests unless the user explicitly requests it. Prefer:
- Unit tests with real implementations
- Full integration tests

Mocking hides real behavior and can mask bugs. Tests should exercise actual code paths.
