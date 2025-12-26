import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AuthShowcase } from "~/_components/auth-showcase";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const response = await fetch("/api/auth/session");
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data?.data?.session ?? null;
    },
  });

  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          TypeScript Template
        </h1>
        <AuthShowcase session={session ?? null} />

        <div className="w-full max-w-2xl">
          <div className="rounded-lg border bg-card p-6 text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to Build</h2>
            <p className="text-muted-foreground mb-4">
              This is a clean TypeScript template with better-auth and Prisma
              ready to go. Start building your application by adding your own
              components and API routes.
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
