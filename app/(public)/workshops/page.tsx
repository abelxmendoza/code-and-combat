import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workshops — Code & Combat by Abel',
  description: 'Small-group Code and Combat workshops are coming later.',
};

export default function WorkshopsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="label-caps mb-4">In the works</p>
      <h1 className="mb-4 text-cb-bone">Small-group workshops are coming later.</h1>
      <p className="max-w-2xl text-cb-gray">
        Code seminars and beginner striking classes are being shaped now. Dates and registration will appear here when they are ready.
      </p>
    </div>
  );
}
