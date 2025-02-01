import { NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/jwt';
import connectDB from '@/app/lib/db';
import Course, { ICourse } from '@/app/models/Course';
import Student from '@/app/models/Student';
import Enrollment from '@/app/models/Enrollment';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || typeof decoded === 'string' || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const student = await Student.findById(decoded.id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const enrolledCourses = (await Course.find({
      _id: { $in: student.enrolledCourses },
    })
      .populate('teachers', 'fullName email')
      .select('title description category startDate endDate schedule teachers')
      .lean()) as unknown as ICourse[];

    const enrollments = await Enrollment.find({
      studentId: student._id,
      courseId: { $in: student.enrolledCourses },
    }).lean();

    const coursesWithEnrollments = enrolledCourses.map((course) => ({
      ...course,
      enrollment: enrollments.find(
        (e) => e.courseId.toString() === course._id.toString()
      ),
    }));

    return NextResponse.json({ courses: coursesWithEnrollments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
