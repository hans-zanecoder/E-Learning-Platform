"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/auth/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    // Temporarily allow both admin and teacher roles
    if (userData.role !== 'admin' && userData.role !== 'teacher') {
      router.push('/auth/login');
      return;
    }

    setUser(userData);
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <Link 
                href="/admin/register" 
                className="text-blue-500 hover:text-blue-700 mr-4"
              >
                Register New Teacher
              </Link>
              <Link 
                href="/admin/register-admin" 
                className="text-green-500 hover:text-green-700 mr-4"
              >
                Register New Admin
              </Link>
              <span className="text-gray-600 dark:text-gray-300 mr-4">Welcome, {user.username}</span>
              <button
                onClick={() => {
                  localStorage.clear();
                  router.push('/auth/login');
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Admin Dashboard</h2>
            {/* Add your admin dashboard content here */}
          </div>
        </div>
      </main>
    </div>
  );
}