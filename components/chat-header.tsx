'use client';

import { memo } from 'react';
import { CubeIcon } from '@/components/icons/cube';
import { GearIcon } from '@/components/icons/gear';
import { Button } from '@/components/ui/button';

// Props for the ChatHeader component are removed as they are no longer used.
// Removed: chatId, selectedModelId, selectedVisibilityType, isReadonly, isSharingOptionEnabled
function PureChatHeader() {
  // Removed: router, open, windowWidth as they are no longer used.

  return (
    <header className="flex sticky top-0 z-10 justify-between items-center p-4 border-b bg-white">
      <div className="flex items-center gap-2">
        <CubeIcon />
        <h1 className="text-lg font-semibold">ChatBot</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="px-4 py-2">
          Share
        </Button>
        <Button variant="ghost" size="icon">
          <GearIcon />
        </Button>
        <div
          className="w-8 h-8 rounded-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80')",
          }}
        ></div>
      </div>
    </header>
  );
}

// Removed the custom comparison function for memo as props are removed.
export const ChatHeader = memo(PureChatHeader);
