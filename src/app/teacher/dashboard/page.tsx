'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bars3Icon,
  ChartPieIcon,
  BookOpenIcon,
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
  AcademicCapIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { swalSuccess, swalError, swalConfirm } from '@/app/utils/swalUtils';

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Check authentication
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/auth/login');
      return;
    }

    const TEACHER_ROLE = 'teacher';

    const userData = JSON.parse(storedUser);
    if (userData.role !== TEACHER_ROLE) {
      router.push('/auth/login');
      return;
    }

    setUser(userData);
    if (!token) {
      swalError(new Error('Authentication token not found'));
      return;
    }

    fetchTeacherCourses(userData._id, token);
  }, []);

  const fetchTeacherCourses = async (teacherId: string, token: string) => {
    try {
      const response = await fetch(`/api/teacher/courses/${teacherId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCourses(data.courses);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      swalError(error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  const handleDeleteCourse = async (courseId: string) => {
    const confirmed = await swalConfirm({
      text: "You won't be able to revert this!",
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (confirmed) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/teacher/courses/${courseId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error);
        }

        await swalSuccess({
          text: 'Course has been deleted'
        });
        
        fetchTeacherCourses(user._id, token!);
      } catch (error: any) {
        console.error('Error deleting course:', error);
        swalError(error);
      }
    }
  };

  const DashboardStats = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                My Courses
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {courses.length}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <BookOpenIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {courses.reduce(
                  (total: number, course: any) =>
                    total + (course.enrolledStudents?.length || 0),
                  0
                )}
              </h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <UsersIcon className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CoursesView = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            My Courses
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => (
            <div
              key={course._id}
              className="bg-white dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {course.name}
                  </h3>
                  <AcademicCapIcon className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {course.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Students: {course.enrolledStudents?.length || 0}
                  </span>
                  <Link
                    href={`/teacher/courses/${course._id}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!user) return null;

  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <Link href="/teacher/dashboard" className="flex ms-2 md:me-24">
                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">
                  E-Learning Hub
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-gray-300">
                Welcome, {user.username}
              </span>
              <UserCircleIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </nav>

      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700`}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
          <ul className="space-y-2 font-medium">
            <li>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex w-full items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <ChartPieIcon className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className="ms-3">Dashboard</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('courses')}
                className="flex w-full items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <BookOpenIcon className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className="ms-3">My Courses</span>
              </button>
            </li>
            <li className="mt-auto">
              <button
                onClick={handleLogout}
                className="flex w-full items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5 text-red-500 transition duration-75 group-hover:text-red-700" />
                <span className="ms-3 text-red-500 group-hover:text-red-700">
                  Logout
                </span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <div className="p-4 sm:ml-64">
        <div className="p-4 mt-14">
          {currentView === 'dashboard' ? (
            <DashboardStats />
          ) : currentView === 'courses' ? (
            <CoursesView />
          ) : null}
        </div>
      </div>
    </>
  );
}
