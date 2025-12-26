import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          About
        </h1>
        <div className="w-full max-w-2xl">
          <div className="bg-card rounded-lg border p-6 text-center">
            <h2 className="mb-4 text-2xl font-semibold">About This Project</h2>
            <p className="text-muted-foreground mb-6">
              A TypeScript monorepo template with better-auth and Prisma. Built
              with TanStack Start for file-based routing.
            </p>
            <Link
              to="/"
              className="text-primary underline-offset-4 hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
