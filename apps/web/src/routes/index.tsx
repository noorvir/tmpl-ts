import { createFileRoute } from "@tanstack/react-router";
import { AuthShowcase } from "~/_components/auth-showcase";
import { getSession } from "~/auth/server";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => {
    const session = await getSession();
    return { session };
  },
});

function Home() {
  const { session } = Route.useLoaderData();

  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-primary">T3</span> Turbo
        </h1>
        <AuthShowcase session={session} />

        <div className="w-full max-w-2xl">
          <div className="rounded-lg border bg-card p-6 text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to Build</h2>
            <p className="text-muted-foreground">
              This is a clean T3 Turbo template with better-auth and Prisma
              ready to go. Start building your application by adding your own
              components and API routes.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
