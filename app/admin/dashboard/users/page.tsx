'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/toast'; // Using the existing toast component

interface AdminUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Forbidden: You do not have access to this resource.');
          }
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        const data = await response.json();
        setUsers(data);
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
    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading users...</p>
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
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Admin Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.isAdmin ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <Button asChild variant="link">
                      <Link href={`/admin/dashboard/users/${user.id}/chats`}>
                        View Chats
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
