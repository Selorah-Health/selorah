import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary opacity-20">404</h1>
        <div className="mt-[-2rem]">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Page not found</h2>
          <p className="text-muted text-lg mb-8 max-w-md mx-auto">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-hover transition-all"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
