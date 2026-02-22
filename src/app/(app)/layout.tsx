import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarWrapper from "@/components/SidebarWrapper";
import ToastProvider from "@/components/ToastProvider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.systemRole === "admin";

  const projects = await prisma.project.findMany({
    where: isAdmin
      ? undefined
      : { members: { some: { userId: session.id } } },
    select: { id: true, name: true, phase: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>
      <SidebarWrapper projects={projects} user={session} />
      <main id="main-content" className="flex-1 overflow-y-auto bg-[#fafbfc] p-8 pt-16 lg:pt-8">
        <ToastProvider>
          {children}
        </ToastProvider>
      </main>
    </div>
  );
}
