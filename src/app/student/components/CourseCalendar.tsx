import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Course } from '../types/course';
import { Enrollment } from '../types/enrollment';

interface CourseCalendarProps {
  courses: Course[];
}

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function CourseCalendar({ courses }: CourseCalendarProps) {
  const events = courses.map((course) => ({
    id: course._id,
    title: `${course.title} (${course.enrollment?.status || 'active'})`,
    start: new Date(course.startDate),
    end: new Date(course.endDate),
    allDay: true,
    resource: {
      ...course,
      enrollmentDate: course.enrollment?.enrollmentDate,
      status: course.enrollment?.status,
    },
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Course Schedule
        </h2>
      </div>
      <div className="h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          views={['month', 'agenda']}
          defaultView="month"
          tooltipAccessor={(event: any) =>
            `${event.title}\n${format(event.start, 'PP')} - ${format(event.end, 'PP')}\nEnrolled: ${
              event.resource.enrollmentDate
                ? format(new Date(event.resource.enrollmentDate), 'PP')
                : 'N/A'
            }`
          }
        />
      </div>
    </div>
  );
}
