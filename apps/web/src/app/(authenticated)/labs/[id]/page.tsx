import LabDetailClient from './lab-detail-client';

// Generate static params for demo labs (required for static export)
export function generateStaticParams() {
  return [
    { id: 'demo-lab-1' },
    { id: 'demo-lab-2' },
    { id: 'demo-lab-3' },
    { id: 'demo-lab-4' },
  ];
}

export default function LabDetailPage() {
  return <LabDetailClient />;
}
