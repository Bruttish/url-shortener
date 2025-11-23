import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { incrementClickCount } from '../lib/api';
import { AlertCircle } from 'lucide-react';

export function Redirect() {
  const { code } = useParams<{ code: string }>();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (code) {
      handleRedirect(code);
    }
  }, [code]);

  async function handleRedirect(code: string) {
    try {
      const targetUrl = await incrementClickCount(code);
      if (targetUrl) {
        window.location.href = targetUrl;
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Redirect failed:', error);
      setNotFound(true);
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-gray-600 mb-6">
            The short link /{code} does not exist or has been deleted.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
