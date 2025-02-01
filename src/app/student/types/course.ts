import { Enrollment } from '@/app/student/types/enrollment';

export interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  teachers: Array<{
    _id: string;
    fullName: string;
    email: string;
  }>;
  schedule: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
  enrolledStudents?: Array<{
    _id: string;
    username: string;
  }>;
  enrollment?: Enrollment;
  lessons?: Array<{
    _id: string;
    title: string;
    dueDate: string;
    completed: boolean;
  }>;
  exams?: Array<{
    _id: string;
    title: string;
    date: string;
    status: 'upcoming' | 'completed' | 'missed';
  }>;
}
