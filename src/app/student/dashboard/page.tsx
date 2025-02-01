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
  ClockIcon,
  PlusCircleIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import EnrollmentModal from '../components/EnrollmentModal';
import { swalSuccess, swalError, swalConfirm } from '@/app/utils/swalUtils';
import CourseCalendar from '../components/CourseCalendar';
import { Course } from '../types/course';
import { Enrollment } from '../types/enrollment';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      icon: ChartPieIcon,
      view: 'dashboard',
    },
    {
      name: 'My Courses',
      icon: BookOpenIcon,
      view: 'my-courses',
    },
    {
      name: 'Exams',
      icon: AcademicCapIcon,
      view: 'exams',
    },
    {
      name: 'Lessons',
      icon: BookmarkIcon,
      view: 'lessons',
    },
    {
      name: 'My Calendar',
      icon: ClockIcon,
      view: 'calendar',
    },
    {
      name: 'Available Courses',
      icon: PlusCircleIcon,
      view: 'available-courses',
    },
    {
      name: 'Profile',
      icon: UserCircleIcon,
      view: 'profile',
    },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/auth/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    fetchEnrolledCourses();
    fetchCourses();
    fetchDashboardStats();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/courses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCourses(data.courses);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      swalError(error, {
        defaultMessage: 'Failed to fetch courses'
      });
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDashboardStats(data);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  const handleEnrollment = async () => {
    if (!selectedCourse) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/student/enroll/${selectedCourse._id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Update the local user data with the new enrollment
      const updatedUser = {
        ...user,
        enrolledCourses: [...(user.enrolledCourses || []), selectedCourse._id],
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      await swalSuccess({
        text: 'Successfully enrolled in the course!'
      });

      // Refresh all necessary data
      await Promise.all([
        fetchEnrolledCourses(),
        fetchCourses(),
        fetchDashboardStats(),
      ]);

      setIsEnrollmentModalOpen(false);
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      swalError(error, {
        defaultMessage: 'Failed to enroll in course'
      });
    }
  };

  const isEnrolled = (courseId: string) => {
    return user?.enrolledCourses?.includes(courseId);
  };

  const handleEnrollClick = (course: Course) => {
    setSelectedCourse(course);
    setIsEnrollmentModalOpen(true);
  };

  const fetchEnrolledCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/enrolled-courses', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      setEnrolledCourses(data.courses);
    } catch (error: any) {
      console.error('Error fetching enrolled courses:', error);
      swalError(error, {
        defaultMessage: 'Failed to fetch enrolled courses'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDropCourse = async (courseId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/enroll/${courseId}`, {
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
        text: 'Successfully dropped the course'
      });

      fetchEnrolledCourses();
    } catch (error: any) {
      console.error('Error dropping course:', error);
      swalError(error);
    }
  };

  const confirmDropCourse = async (courseId: string) => {
    const confirmed = await swalConfirm({
      text: "You won't be able to revert this!",
      confirmButtonText: 'Yes, drop course!'
    });
    
    if (confirmed) {
      handleDropCourse(courseId);
    }
  };

  const AvailableCoursesView = () => {
    return (
      <div className="mt-6">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Available Courses
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col h-full"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <BookOpenIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {course.title}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      (course.enrolledStudents?.length || 0) > 0
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {(course.enrolledStudents?.length || 0) > 0
                      ? 'Active'
                      : 'New'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {course.description || 'No description available'}
                </p>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {(course.teachers &&
                            course.teachers[0]?.fullName?.charAt(0)) ||
                            'U'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        {(course.teachers && course.teachers[0]?.fullName) ||
                          'Unassigned'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {course.enrolledStudents?.length || 0} students
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          setIsEnrollmentModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm"
                      >
                        Enroll →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MyCourses = () => {
    //will delete this console log later
    console.log('Enrolled Courses:', enrolledCourses);

    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!enrolledCourses || enrolledCourses.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            You haven't enrolled in any courses yet.
          </p>
          <button
            onClick={() => setCurrentView('available-courses')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Available Courses
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            My Enrolled Courses
          </h2>
          <div className="flex items-center mt-4 sm:mt-0">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showCalendar}
                onChange={(e) => setShowCalendar(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                {showCalendar ? 'Calendar View' : 'List View'}
              </span>
            </label>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Enrolled Courses: {enrolledCourses.length}
          </div>
        </div>

        {showCalendar ? (
          <div className="h-[600px]">
            <CourseCalendar courses={enrolledCourses} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => (
              <div
                key={course._id}
                className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-600"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <BookOpenIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                        {course.title}
                      </h3>
                    </div>
                    {course.enrollment && (
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          course.enrollment.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : course.enrollment.status === 'completed'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {course.enrollment.status.charAt(0).toUpperCase() +
                          course.enrollment.status.slice(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {course.description?.substring(0, 100)}...
                  </p>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <UsersIcon className="h-4 w-4 mr-2" />
                      <span>
                        Teacher: {course.teachers[0]?.fullName || 'Unassigned'}
                      </span>
                    </div>
                    {course.enrollment && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          Enrolled:{' '}
                          {new Date(
                            course.enrollment.enrollmentDate
                          ).toLocaleDateString()}
                        </span>
                        <br />
                        <span>Enrollment ID: {course.enrollment._id}</span>
                      </div>
                    )}
                    {course.schedule &&
                      course.schedule.map((schedule, index) => (
                        <div
                          key={index}
                          className="mt-2 text-sm text-gray-500 dark:text-gray-400"
                        >
                          {schedule.dayOfWeek}: {schedule.startTime} -{' '}
                          {schedule.endTime}
                        </div>
                      ))}
                  </div>

                  <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="space-y-2">
                      {course.lessons && (
                        <div className="text-sm">
                          <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Lessons
                          </div>
                          <div className="pl-2">
                            <div className="text-gray-600 dark:text-gray-400">
                              Completed:{' '}
                              {course.lessons.filter((l) => l.completed).length}{' '}
                              / {course.lessons.length}
                            </div>
                          </div>
                        </div>
                      )}

                      {course.exams && (
                        <div className="text-sm">
                          <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Exams
                          </div>
                          <div className="pl-2">
                            {course.exams.map((exam) => (
                              <div
                                key={exam._id}
                                className="flex justify-between items-center"
                              >
                                <span className="text-gray-600 dark:text-gray-400">
                                  {exam.title}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    exam.status === 'upcoming'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : exam.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {exam.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => confirmDropCourse(course._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Drop Course
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const CalendarView = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Course Calendar
          </h2>
        </div>
        <div className="h-[600px]">
          <CourseCalendar courses={enrolledCourses} />
        </div>
      </div>
    );
  };

  const DashboardStats = () => {
    const upcomingExams = enrolledCourses.reduce((total, course) => {
      const courseExams =
        course.exams?.filter((exam) => exam.status === 'upcoming') || [];
      return total + courseExams.length;
    }, 0);

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Enrolled Courses Card */}
          <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Enrolled Courses
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardStats.enrolledCourses}
                </h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <BookOpenIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </div>

          {/* Upcoming Classes Card */}
          <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Upcoming Classes
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    enrolledCourses.filter(
                      (course) =>
                        new Date(course.startDate as string) > new Date()
                    ).length
                  }
                </h3>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <ClockIcon className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </div>

          {/* Finished Courses Card */}
          <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Finished Courses
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    enrolledCourses.filter(
                      (course) => course.enrollment?.status === 'completed'
                    ).length
                  }
                </h3>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <AcademicCapIcon className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Modernized Upcoming Exams and Recent Lessons Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Exams Section */}
          <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upcoming Exams
              </h2>
            </div>
            <div className="space-y-4">
              {enrolledCourses.map((course) =>
                course.exams
                  ?.filter((exam) => exam.status === 'upcoming')
                  .map((exam) => (
                    <div
                      key={exam._id}
                      className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <AcademicCapIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {exam.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {course.title}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(exam.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(exam.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
              {upcomingExams === 0 && (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No upcoming exams
                </div>
              )}
            </div>
          </div>

          {/* Recent Lessons Section */}
          <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Lessons
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {enrolledCourses.map((course) =>
                course.lessons?.slice(0, 3).map((lesson) => (
                  <div
                    key={lesson._id}
                    className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            lesson.completed
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-yellow-100 dark:bg-yellow-900/30'
                          }`}
                        >
                          <BookOpenIcon
                            className={`w-5 h-5 ${
                              lesson.completed
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-yellow-600 dark:text-yellow-400'
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {lesson.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {course.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            lesson.completed
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}
                        >
                          {lesson.completed ? 'Completed' : 'Pending'}
                        </span>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Due: {new Date(lesson.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {!enrolledCourses.some(
                (course) => (course.lessons || []).length > 0
              ) && (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No lessons available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ExamsView = () => {
    const allExams = enrolledCourses.flatMap((course) =>
      (course.exams || []).map((exam) => ({
        ...exam,
        courseName: course.title,
      }))
    );

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 h-[600px] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            All Exams
          </h2>
        </div>
        <div className="space-y-4">
          {allExams.map((exam) => (
            <div
              key={exam._id}
              className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      exam.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : exam.status === 'upcoming'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                    }`}
                  >
                    <AcademicCapIcon
                      className={`w-5 h-5 ${
                        exam.status === 'completed'
                          ? 'text-green-600 dark:text-green-400'
                          : exam.status === 'upcoming'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {exam.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {exam.courseName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(exam.date).toLocaleDateString()}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      exam.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : exam.status === 'upcoming'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {exam.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LessonsView = () => {
    const allLessons = enrolledCourses.flatMap((course) =>
      (course.lessons || []).map((lesson) => ({
        ...lesson,
        courseName: course.title,
      }))
    );

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 h-[600px] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            All Lessons
          </h2>
        </div>
        <div className="space-y-4">
          {allLessons.map((lesson) => (
            <div
              key={lesson._id}
              className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      lesson.completed
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-yellow-100 dark:bg-yellow-900/30'
                    }`}
                  >
                    <BookOpenIcon
                      className={`w-5 h-5 ${
                        lesson.completed
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {lesson.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {lesson.courseName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      lesson.completed
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {lesson.completed ? 'Completed' : 'Pending'}
                  </span>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Due: {new Date(lesson.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardStats />;
      case 'my-courses':
        return <MyCourses />;
      case 'exams':
        return <ExamsView />;
      case 'lessons':
        return <LessonsView />;
      case 'calendar':
        return <CalendarView />;
      case 'available-courses':
        return <AvailableCoursesView />;
      default:
        return <DashboardStats />;
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Navigation */}
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
              <Link href="/student/dashboard" className="flex ms-2 md:me-24">
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

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700`}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
          <ul className="space-y-2 font-medium">
            {navigation.map((item) => (
              <li key={item.view}>
                <button
                  onClick={() => setCurrentView(item.view)}
                  className="flex w-full items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                >
                  <item.icon className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <span className="ms-3">{item.name}</span>
                </button>
              </li>
            ))}
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

      {/* Main Content */}
      <div className="p-4 sm:ml-64">
        <div className="p-4 mt-14">{renderContent()}</div>
      </div>

      {/* Enrollment Modal */}
      {selectedCourse && (
        <EnrollmentModal
          isOpen={isEnrollmentModalOpen}
          closeModal={() => setIsEnrollmentModalOpen(false)}
          course={selectedCourse}
          onEnroll={handleEnrollment}
        />
      )}
    </>
  );
}
