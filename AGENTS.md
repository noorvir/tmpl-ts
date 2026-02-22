# Code Style

Modelled after [Go code review comments](https://go.dev/wiki/CodeReviewComments).

> **Note:** Never add this file (AGENTS.md) to .gitignore. It must be committed and shared.

## General

### Early returns

Keep the normal code path at minimal indentation. Return/break/continue/throw early from if statements.

```ts
// Do
if (condition) {
  console.log('condition A');
  return;
}
console.log('condition B');

// Don't
if (condition) {
  console.log('condition A');
} else {
  console.log('condition B');
}
```

### Composability

Keep functions/methods small and focused. Roughly 50 lines of code.

### Dependency Injection

Use dependency injection where possible (~90% of the time). Makes testing easier.

```ts
// Do
function getUserEmail(user: { emails: string[] }) {
  const email = user.emails.find((u) => ...);
}

// Don't
function getUserEmail(userId: string) {
  const user = getUser(userId);
  const email = user.emails.find((u) => ...);
}
```

### File names

Use `kebab-case` for all file and folder names, including React components.

### Args

Use a single `args` object parameter for functions with multiple parameters.

```ts
function myFunction(args: { param1: string; param2: number }) {
  // ...
}
```

### Logging

Use structured logging. Prefer a base message with fields.

```ts
// Do
logger.info('New user signed up', { email, name });

// Don't
console.log(`New user ${name} signed up with email ${email}`);
```

## Frontend

### Handler props

Name handlers `handle<Event>` in the defining component, pass as `on<Event>` to children.

## Error Handling

Prefer using a `tc` (try-catch) wrapper for async error handling that returns `{ data, error }` instead of throwing. Wrap errors with contextual messages for better debugging.

```ts
const res = await tc(someAsyncFunction());
if (res.error) {
  throw wrapError(res.error, 'Contextual error message');
}
// Use res.data safely here
```
