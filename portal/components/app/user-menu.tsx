"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function initials(name?: string | null, email?: string | null) {
  const src = (name ?? email ?? "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const { data } = useSession();
  const user = data?.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="grid h-7 w-7 place-items-center rounded-full border border-border-strong bg-gradient-to-br from-accent/30 to-accent/5 font-mono text-[10px] font-semibold uppercase transition-colors hover:border-accent/60"
          aria-label="Account"
        >
          {user ? initials(user.name, user.email) : <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        {user ? (
          <>
            <DropdownMenuLabel>Signed in</DropdownMenuLabel>
            <div className="px-2 pb-2">
              <div className="truncate text-[13px] font-medium">{user.name || user.email}</div>
              <div className="truncate font-mono text-[11px] text-muted-foreground">
                {user.email}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[hsl(var(--danger))] focus:text-[hsl(var(--danger))]"
              onClick={async () => {
                await signOut();
                router.push("/sign-in");
                router.refresh();
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={() => router.push("/sign-in")}>
            <UserIcon className="h-3.5 w-3.5" />
            Sign in
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
