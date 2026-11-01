import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Button } from "@acme/ui/button";

import { useTRPC } from "~/trpc/react";
import { SubmitButton } from "./submit-button";

export function AuthShowcase() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const sessionQ = useQuery(trpc.auth.getSession.queryOptions());

  const signOutM = useMutation({
    mutationFn: () =>
      fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: trpc.auth.getSession.queryKey(),
      }),
  });

  const user = sessionQ.data?.user;

  if (!user) {
    return (
      <Button size="lg" asChild>
        <Link to="/sign-in" search={{ mode: "sign-in" }}>
          Sign in
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">Signed in as {user.name}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          signOutM.mutate();
        }}
      >
        <SubmitButton label="Sign out" isPending={signOutM.isPending} />
      </form>
    </div>
  );
}
