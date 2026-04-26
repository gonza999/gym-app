import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600">404</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">Página no encontrada</p>
      <Link
        href="/"
        className="inline-block mt-6 bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700"
      >
        Ir al inicio
      </Link>
    </main>
  );
}
