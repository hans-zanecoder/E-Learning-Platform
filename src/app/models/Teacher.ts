import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ITeacher extends Document {
  username: string;
  email: string;
  password: string;
  role: string;
  fullName: string;
  course: string;
}

const teacherSchema = new Schema<ITeacher>({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  role: {
    type: String,
    enum: ['teacher'],
    default: 'teacher',
  },
  fullName: {
    type: String,
    required: [true, 'Please provide a full name'],
  },
  course: {
    type: String,
    required: [true, 'Please provide a course'],
  }
}, { timestamps: true });

// Hash password before saving
teacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Teacher = mongoose.models.Teacher || mongoose.model<ITeacher>('Teacher', teacherSchema);
export default Teacher;