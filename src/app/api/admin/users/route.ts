import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import Student from '@/app/models/Student';
import Teacher from '@/app/models/Teacher';
import { verifyJWT } from '@/app/lib/jwt';

// Get all users
export async function GET(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await verifyJWT(token);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const students = await Student.find({}, '-password');
    const teachers = await Teacher.find({}, '-password');
    
    return NextResponse.json({ users: [...students, ...teachers] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete user
export async function DELETE(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await verifyJWT(token);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, role } = await req.json();
    await connectDB();

    const Model = role === 'student' ? Student : Teacher;
    await Model.findByIdAndDelete(userId);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 