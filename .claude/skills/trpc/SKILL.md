---
name: trpc
description: tRPC usage patterns with React Query. Auto-apply when writing or modifying tRPC queries, mutations, or API calls in React components.
user-invocable: false
---

# tRPC Usage Guide

This project uses tRPC with React Query for type-safe API calls.

## Imports

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTRPC } from '@/trpc/client';
```

## Basic Pattern

```typescript
export default function MyComponent() {
  const trpc = useTRPC();

  // Queries — use Q suffix
  const dataQ = useQuery(trpc.router.procedure.queryOptions());
  const data = dataQ.data || [];

  // Mutations — use M suffix
  const createM = useMutation(trpc.router.create.mutationOptions());
  const updateM = useMutation(trpc.router.update.mutationOptions());
}
```

## Invalidating Queries

Return the invalidation promise so the mutation stays pending until refetch completes:

```typescript
mutation.mutate(
  { id },
  {
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: trpc.router.procedure.queryKey({ id }),
      }),
  },
);
```

## Error Handling

```typescript
const handleAction = async (event: React.MouseEvent, id: string) => {
  event.stopPropagation();
  try {
    await mutation.mutateAsync({ id });
    query.refetch();
    toast.success('Action completed successfully');
  } catch (error: any) {
    toast.error(error.message || 'Action failed');
  }
};
```

## Rules

- Destructure data with fallbacks: `query.data?.items || []`
- Use `mutation.isPending` to disable buttons during operations
- Always `refetch()` relevant queries after successful mutations
- Use `stopPropagation()` when buttons are inside clickable rows
