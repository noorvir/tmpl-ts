import { useQuery } from "@tanstack/react-query";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card } from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import appCss from "~/globals.css?url";
import { TRPCReactProvider, useTRPC } from "~/trpc/react";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Link to="/">
        <Button variant="outline">Go home</Button>
      </Link>
    </div>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function HealthIndicator() {
  const trpc = useTRPC();
  const healthQ = useQuery(trpc.health.check.queryOptions());

  if (healthQ.isLoading) {
    return <Badge variant="secondary">checking...</Badge>;
  }

  if (healthQ.isError) {
    return <Badge variant="destructive">API offline</Badge>;
  }

  return <Badge variant="default">API online</Badge>;
}

function RootComponent() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TRPCReactProvider>
        <Outlet />
        <div className="absolute bottom-4 right-4 flex gap-2">
          <HealthIndicator />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Components</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Example Components</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Badge>Badge</Badge>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Card className="p-2">Card</Card>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
        <Toaster />
      </TRPCReactProvider>
    </ThemeProvider>
  );
}
