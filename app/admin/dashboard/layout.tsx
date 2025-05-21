import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'sonner'; // For toast notifications, if needed in dashboard pages
import { ThemeProvider } from '@/components/theme-provider'; // Consistent theme

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // The session.user type should have isAdmin from the auth.ts setup
  // Using `as any` for now as a safeguard if type propagation isn't perfect.
  if (!session?.user || !(session.user as any).isAdmin) {
    redirect('/admin/login');
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen bg-background text-foreground">
        <aside className="w-60 flex-shrink-0 border-r bg-muted/40 p-4">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/admin/dashboard/users" className="flex items-center gap-2 font-semibold">
                <span className="">Admin Panel</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-auto">
              <ul className="grid items-start px-2 text-sm font-medium lg:px-4">
                <li>
                  <Link
                    href="/admin/dashboard/users"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  >
                    Users
                  </Link>
                </li>
                {/* Future admin links can be added here */}
                {/* Example:
                <li>
                  <Link
                    href="/admin/dashboard/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                  >
                    Settings
                  </Link>
                </li>
                */}
              </ul>
            </nav>
          </div>
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
