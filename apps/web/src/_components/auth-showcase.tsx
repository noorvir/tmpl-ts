"use client";

import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";

export function AuthShowcase({
  session,
}: {
  session: { user: { name?: string | null } } | null;
}) {
  const queryClient = useQueryClient();

  if (!session) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          window.location.href = "/api/auth/signin/discord?callbackURL=/";
        }}
      >
        <Button size="lg" type="submit">
          Sign in with Discord
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in as {session.user.name}</span>
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await fetch("/api/auth/signout", { method: "POST" });
          await queryClient.invalidateQueries({ queryKey: ["session"] });
        }}
      >
        <Button size="lg" type="submit">
          Sign out
        </Button>
      </form>
    </div>
  );
}
