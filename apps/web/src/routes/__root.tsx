import { createRootRoute } from "@tanstack/react-router";
import { Outlet, ScrollRestoration } from "@tanstack/react-router";

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

import { TRPCReactProvider } from "~/trpc/react";

import "~/globals.css";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TRPCReactProvider>
        <Outlet />
      </TRPCReactProvider>
      <div className="absolute bottom-4 right-4 flex gap-2">
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
      <ScrollRestoration />
    </ThemeProvider>
  ),
});
