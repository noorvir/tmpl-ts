import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Button } from "@acme/ui/button";
import { Card } from "@acme/ui/card";
import { Badge } from "@acme/ui/badge";

import { TRPCReactProvider, useTRPC } from "~/trpc/react";

import appCss from "~/globals.css?url";

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
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <ScrollRestoration />
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
