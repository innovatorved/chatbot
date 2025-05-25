'use client';

import type { Attachment } from 'ai';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage } from 'usehooks-ts';

import { PaperclipIcon } from '@/components/icons/paperclip'; // Adjusted path
import { Textarea } from './ui/textarea';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';

// Props are simplified as some features (like message suggestions, direct stop button) are removed
function PureMultimodalInput({
  chatId, // Keep chatId if needed for API calls or context, even if not directly in submitForm now
  input,
  setInput,
  status,
  // stop, // Removed as there's no explicit stop button in new UI
  attachments, // Kept for potential future use or if file handling logic is retained
  setAttachments, // Kept for potential future use
  handleSubmit,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  // stop: () => void; // Removed
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  // messages: Array<UIMessage>; // Removed, not used by new input
  // setMessages: UseChatHelpers['setMessages']; // Removed
  // append: UseChatHelpers['append']; // Removed, no suggested actions
  handleSubmit: UseChatHelpers['handleSubmit'];
  // className?: string; // Removed, specific classes are applied directly
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Removed useEffect for adjustHeight on mount, as new design is fixed height initially
  // Removed adjustHeight and resetHeight, assuming CSS handles height or fixed height

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    `input-${chatId}`, // Make localStorage key chat-specific
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const finalValue = textareaRef.current.value || localStorageInput || '';
      setInput(finalValue);
      // No adjustHeight() here as fixed height is assumed or handled by CSS
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]); // Ensure this runs if chatId changes

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setInput(event.target.value);
    // No adjustHeight()
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleActualSubmit = useCallback(() => {
    // window.history.replaceState({}, '', `/chat/${chatId}`); // This might be handled by parent or router
    handleSubmit(undefined, {
      experimental_attachments: attachments, // Pass attachments if any
    });
    setAttachments([]); // Clear attachments after submit
    setInput(''); // Clear input after submit
    setLocalStorageInput('');
    // resetHeight(); // No resetHeight
    textareaRef.current?.focus();
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setInput,
    setLocalStorageInput,
    // chatId, // Already in scope
  ]);

  const uploadFile = async (file: File): Promise<Attachment | undefined> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        return {
          url: data.url,
          name: data.name,
          contentType: data.type,
        };
      }
      const { error } = await response.json();
      toast.error(error || 'Failed to upload file.');
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
    return undefined;
  };

  const handleFileSelection = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      // For simplicity, only handling the first file as per new UI (no multi-preview)
      const file = files[0];
      const uploadedAttachment = await uploadFile(file);
      if (uploadedAttachment) {
        setAttachments((prev) => [...prev, uploadedAttachment]);
        // Optionally, immediately submit or wait for user to press send
        // For now, we just add it to attachments. User presses send.
        toast.success(`File "${uploadedAttachment.name}" attached.`);
      }
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [setAttachments],
  );

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border-t">
      {/* Select Dropdown */}
      <select
        defaultValue=""
        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#101518] focus:outline-0 focus:ring-0 border border-[#d4dce2] bg-gray-50 focus:border-[#d4dce2] h-14 bg-[image:--select-button-svg] placeholder:text-[#5c748a] p-[15px] text-base font-normal leading-normal"
      >
        <option value="">one</option>
        <option value="two">two</option>
        <option value="three">three</option>
      </select>

      {/* Hidden file input */}
      <input
        type="file"
        className="hidden" // Keep it truly hidden
        ref={fileInputRef}
        onChange={handleFileSelection}
        // multiple // Removed multiple as new UI doesn't suggest multi-file preview
      />

      {/* Main Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (status !== 'ready' && status !== 'idle') {
            // status can be 'idle' before first submission
            toast.error('Please wait for the model to finish its response!');
          } else if (input.trim() || attachments.length > 0) {
            handleActualSubmit();
          }
        }}
        className="flex flex-col min-w-40 h-12 flex-1" // Corresponds to outer label in HTML
      >
        <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
          <Textarea
            ref={textareaRef}
            placeholder="Type your message here..."
            value={input}
            onChange={handleInputChange}
            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#101518] focus:outline-0 focus:ring-0 border-none bg-[#eaedf1] focus:border-none h-full placeholder:text-[#5c748a] px-4 rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
            rows={1} // Keep it single line like, CSS will handle height.
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                if (status !== 'ready' && status !== 'idle') {
                  toast.error(
                    'Please wait for the model to finish its response!',
                  );
                } else if (input.trim() || attachments.length > 0) {
                  handleActualSubmit();
                }
              }
            }}
          />
          <div className="flex border-none bg-[#eaedf1] items-center justify-center pr-4 rounded-r-xl border-l-0 !pr-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center p-1.5"
                disabled={status !== 'ready' && status !== 'idle'}
                aria-label="Attach file"
              >
                <div
                  className="text-[#5c748a]"
                  data-icon="Paperclip"
                  data-size="20px"
                  data-weight="regular"
                >
                  <PaperclipIcon size={20} />
                </div>
              </button>
            </div>
            <button
              type="submit"
              className="min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#dce8f3] text-[#101518] text-sm font-medium leading-normal hidden @[480px]:block"
              disabled={
                (status !== 'ready' && status !== 'idle') ||
                (input.trim() === '' && attachments.length === 0)
              }
            >
              <span className="truncate">Send</span>
            </button>
          </div>
        </div>
      </form>
      {/* Removed attachments preview and old buttons/suggested actions */}
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    // Removed other props from comparison as they are gone or less critical for re-render
    return true;
  },
);

// Removed AttachmentsButton, StopButton, SendButton functional components
// as their logic is now integrated or removed.
