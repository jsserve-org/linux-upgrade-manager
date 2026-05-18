import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, ssoConfigured } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (ssoConfigured) {
    const session = await auth.api
      .getSession({ headers: await headers() })
      .catch(() => null);
    if (!session) redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
