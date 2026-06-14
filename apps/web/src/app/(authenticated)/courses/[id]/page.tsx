import CourseDetailClient from './course-detail-client';

// Generate static params for courses (required for static export)
export function generateStaticParams() {
  return [
    { id: 'course-1' },
    { id: 'course-2' },
    { id: 'course-3' },
  ];
}

export default function CourseDetailPage() {
  return <CourseDetailClient />;
}
