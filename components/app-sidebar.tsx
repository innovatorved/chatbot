'use client';

'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { EnvelopeIcon } from '@/components/icons/envelope';
import { PencilSimpleIcon } from '@/components/icons/pencil-simple';
import { UserCircleIcon } from '@/components/icons/user-circle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';

export function AppSidebar({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                AI Writing Assistant
              </span>
            </Link>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-4">
        <div className="flex flex-col gap-2 px-2">
          <Link
            href="#"
            className="flex items-center gap-2 p-2 rounded-md bg-[#eaedf1]"
            onClick={() => {
              setOpenMobile(false);
            }}
          >
            <PencilSimpleIcon />
            <span>Rephrase</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 p-2 rounded-md"
            onClick={() => {
              setOpenMobile(false);
            }}
          >
            <EnvelopeIcon />
            <span>Email</span>
          </Link>
        </div>
      </SidebarContent>
      <SidebarFooter>
        {user && (
          <div className="flex items-center gap-2 p-2 rounded-md">
            <UserCircleIcon />
            <span>{user.email}</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
