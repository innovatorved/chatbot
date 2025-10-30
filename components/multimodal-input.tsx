'use client';

import type { Attachment, UIMessage } from 'ai';
import cx from 'classnames';
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
  useMemo,
  startTransition,
  useOptimistic,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon, PaperclipIcon, StopIcon, ChevronDownIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';
import { chatModels } from '@/lib/ai/models';
import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const uploadFile = async (file: File) => {
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
    toast.error(error);
  } catch (error) {
    toast.error('Failed to upload file, please try again!');
  }
};

// Compact Model Selector for Input
function InlineModelSelector({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const selectedModel = useMemo(
    () => chatModels.find((m) => m.id === optimisticModelId),
    [optimisticModelId],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors gap-1.5 rounded-lg',
            className,
          )}
        >
          <span className="max-w-[80px] truncate">
            {selectedModel?.name || 'Model'}
          </span>
          <ChevronDownIcon size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        className="w-[300px] max-h-[400px] overflow-y-auto"
      >
        {chatModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onSelect={() => {
              setOpen(false);
              startTransition(() => {
                setOptimisticModelId(model.id);
                saveChatModelAsCookie(model.id);
              });
            }}
            className="flex flex-col items-start gap-1 cursor-pointer py-2.5"
          >
            <div className="font-medium text-sm">{model.name}</div>
            <div className="text-xs text-muted-foreground line-clamp-2">
              {model.description}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  selectedModelId,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
  selectedModelId: string;
}) {
  const { textareaRef, adjustHeight, resetHeight } =
    useAutoResizeTextarea<HTMLTextAreaElement>();
  const { width } = useWindowSize();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    resetHeight,
    textareaRef,
  ]);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  return (
    <div className="relative w-full flex flex-col gap-4">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div className="relative">
        <Textarea
          data-testid="multimodal-input"
          ref={textareaRef}
          placeholder="Message ChatBot..."
          value={input}
          onChange={handleInput}
          className={cx(
            messages.length === 0 ? 'min-h-[120px]' : 'min-h-[52px]',
            'max-h-[calc(75dvh)] overflow-hidden resize-none rounded-3xl text-base bg-muted pl-12 pr-24 py-3.5 border-2 border-border transition-colors',
            className,
          )}
          rows={messages.length === 0 ? 3 : 1}
          autoFocus
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();

              if (status !== 'ready') {
                toast.error(
                  'Please wait for the model to finish its response!',
                );
              } else {
                submitForm();
              }
            }
          }}
        />

        {/* Left side - Attachment button */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center">
          <AttachmentsButton fileInputRef={fileInputRef} status={status} />
        </div>

        {/* Right side - Model selector and Send button */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <InlineModelSelector selectedModelId={selectedModelId} />
          {status === 'submitted' ? (
            <StopButton stop={stop} setMessages={setMessages} />
          ) : (
            <SendButton
              input={input}
              submitForm={submitForm}
              uploadQueue={uploadQueue}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="h-8 w-8 p-0 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
      size="sm"
    >
      <PaperclipIcon size={18} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="h-8 w-8 p-0 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
      size="sm"
    >
      <StopIcon size={18} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="h-8 w-8 p-0 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
      size="sm"
    >
      <ArrowUpIcon size={18} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
