import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ILesson extends Document {
  _id: string;
  title: string;
  content: string;
  courseId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    title: {
      type: String,
      required: [true, 'Please provide a lesson title'],
    },
    content: {
      type: String,
      required: [true, 'Please provide lesson content'],
    },
    courseId: {
      type: String,
      ref: 'Course',
      required: [true, 'Please provide a course ID'],
    },
    order: {
      type: Number,
      required: [true, 'Please provide lesson order'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Lesson ||
  mongoose.model<ILesson>('Lesson', lessonSchema);
