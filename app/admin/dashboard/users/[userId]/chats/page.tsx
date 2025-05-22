'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/toast';
import { Markdown } from '@/components/markdown'; // For rendering message content

// Define types based on what the API /api/admin/chats/[userId] returns
// This should align with ChatWithMessages from lib/db/queries.ts
interface DBDAttachment {
  type: 'file' | 'image' | 'video' | 'audio' | 'link';
  name: string;
  url: string;
  size?: number;
  status?: 'uploading' | 'uploaded' | 'error';
}

interface DBMessagePart {
  type: 'text' | 'tool-call' | 'tool-result';
  text?: string; // Content for text parts
  // Add other fields if parts can be more complex (e.g., for tool calls/results)
  toolName?: string;
  toolArgs?: any;
  result?: any;
}
interface DBMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system' | 'tool'; // Role of the message sender
  parts: DBMessagePart[]; // Using parts for content
  attachments: DBDAttachment[];
  createdAt: string; // Assuming string date from JSON
}

interface Chat {
  id: string;
  createdAt: string; // Assuming string date from JSON
  title: string;
  userId: string;
  visibility: 'public' | 'private';
}

interface ChatWithMessages extends Chat {
  messages: DBMessage[];
}

export default function UserChatsPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [chats, setChats] = useState<ChatWithMessages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null); // Optional: fetch user email too

  useEffect(() => {
    if (!userId) return;

    async function fetchChatData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch user details (optional, for display like "Chats for user X")
        // This assumes /api/admin/users/:id endpoint or similar, or pass email via props/state
        // For now, we'll skip fetching the user's email to keep it simpler.

        // Fetch chats and messages
        const response = await fetch(`/api/admin/chats/${userId}`);
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error(
              'Forbidden: You do not have access to this resource.',
            );
          }
          if (response.status === 404) {
            setChats([]); // User exists but has no chats
            return;
          }
          throw new Error(`Failed to fetch chats: ${response.statusText}`);
        }
        const data = await response.json();
        setChats(data);
      } catch (err: any) {
        setError(err.message);
        toast({
          type: 'error',
          description: err.message || 'An unexpected error occurred.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchChatData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading chat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <p>Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          Chat History for User{' '}
          <span className="font-mono text-sm">{userId}</span>
        </h1>
        <Button asChild variant="outline">
          <Link href="/admin/dashboard/users">Back to Users List</Link>
        </Button>
      </div>

      {chats.length === 0 ? (
        <p>No chats found for this user.</p>
      ) : (
        chats.map((chat) => (
          <Card key={chat.id}>
            <CardHeader>
              <CardTitle>{chat.title || 'Untitled Chat'}</CardTitle>
              <CardDescription>
                Chat ID: {chat.id} | Created:{' '}
                {new Date(chat.createdAt).toLocaleString()} | Visibility:{' '}
                {chat.visibility}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {chat.messages.length === 0 ? (
                <p>No messages in this chat.</p>
              ) : (
                chat.messages.map((message) => (
                  <div
                    key={message.id}
                    className="p-3 rounded-md border bg-muted/20"
                  >
                    <p className="text-sm font-semibold capitalize">
                      {message.role}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Message ID: {message.id} | Created:{' '}
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                    <Separator className="my-2" />
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.parts.map((part, index) => {
                        if (part.type === 'text' && part.text) {
                          return <Markdown key={index}>{part.text}</Markdown>;
                        }
                        // Add rendering for other part types if necessary
                        return (
                          <pre key={index}>{JSON.stringify(part, null, 2)}</pre>
                        );
                      })}
                    </div>
                    {message.attachments && message.attachments.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mt-2">
                          Attachments:
                        </p>
                        <ul className="list-disc list-inside pl-4">
                          {message.attachments.map((att, idx) => (
                            <li key={idx} className="text-xs">
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {att.name} ({att.type})
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
