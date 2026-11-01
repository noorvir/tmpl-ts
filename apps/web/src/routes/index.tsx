import { createFileRoute, Link } from "@tanstack/react-router";

// @module auth
import { AuthShowcase } from "~/_components/auth-showcase";
// @end-module

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          TypeScript Template
        </h1>
        {/* @module auth */}
        <AuthShowcase />
        {/* @end-module */}

        <div className="w-full max-w-2xl">
          <div className="bg-card rounded-lg border p-6 text-center">
            <h2 className="mb-4 text-2xl font-semibold">Ready to Build</h2>
            <p className="text-muted-foreground mb-4">
              Start building your application by adding your own components
              and API routes.
            </p>
            <Link
              to="/about"
              className="text-primary underline-offset-4 hover:underline"
            >
              Learn more about this project →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
