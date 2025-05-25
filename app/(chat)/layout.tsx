// Removed cookies import as isCollapsed is no longer used here
import { AppSidebar } from '@/components/app-sidebar';
import { auth } from '../(auth)/auth';
// Removed Script import for Pyodide

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth(); // Fetch session for AppSidebar

  // The main font-family is now set in app/layout.tsx
  // The --select-button-svg variable is specific to the select element in MultimodalInput,
  // but the provided HTML places it on a root div. For now, following the HTML.
  // Ideally, this would be in a CSS file or scoped more locally to the component using it.
  const selectButtonSvg =
    "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%235C748A' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")";

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden"
      style={{ '--select-button-svg': selectButtonSvg } as React.CSSProperties}
    >
      <div className="layout-container flex h-full grow flex-col">
        <div className="gap-1 px-6 flex flex-1 justify-center py-5">
          {/* AppSidebar is placed here, assuming it's refactored */}
          <div className="layout-content-container flex flex-col w-80">
            <AppSidebar user={session?.user} />
          </div>
          {/* Main chat content from page.tsx */}
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
