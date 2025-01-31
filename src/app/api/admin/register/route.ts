import { NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/jwt';
import Teacher from '@/app/models/Teacher';
import connectDB from '@/app/lib/db';

export async function POST(req: Request) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    // Allow only admin and teacher roles
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, email, password, fullName, course } = await req.json();

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({
      $or: [{ email }, { username }]
    });

    if (existingTeacher) {
      return NextResponse.json({ error: 'Teacher already exists' }, { status: 400 });
    }

    // Create new teacher
    const newTeacher = new Teacher({
      username,
      email,
      password,
      fullName,
      course,
      role: 'teacher'
    });

    await newTeacher.save();
    console.log('New teacher saved:', newTeacher);

    return NextResponse.json({
      message: 'Teacher created successfully',
      user: {
        id: newTeacher._id,
        username: newTeacher.username,
        email: newTeacher.email,
        role: newTeacher.role,
        course: newTeacher.course
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 