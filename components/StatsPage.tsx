import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, BarChart3, Clock, Calendar, Link as LinkIcon } from 'lucide-react';
import { getLinkByCode, LinkStatsResponse } from '../lib/api';

export function StatsPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<LinkStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (code) {
      loadStats(code);
    }
  }, [code]);

  async function loadStats(code: string) {
    try {
      setLoading(true);
      setError('');
      const data = await getLinkByCode(code);
      if (!data) {
        setError('Link not found');
      } else {
        setLink(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load link statistics');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (link) {
      const url = `${window.location.origin}/${link.code}`;
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading statistics...</div>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-red-500 mb-4">
              <BarChart3 className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h2>
            <p className="text-gray-600">{error || 'The requested link does not exist.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const shortUrl = `${window.location.origin}/${link.code}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Link Statistics</h1>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Short URL:</span>
                <code className="px-2 py-1 bg-white rounded border border-gray-200 text-blue-600 font-mono text-sm">
                  /{link.code}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Target URL
              </label>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 break-all">
                  <a
                    href={link.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {link.target_url}
                  </a>
                </div>
                <a
                  href={link.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Total Clicks</span>
                </div>
                <p className="text-3xl font-bold text-blue-900">{link.click_count}</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Last Clicked</span>
                </div>
                <p className="text-sm font-medium text-green-900 break-words">
                  {link.last_clicked_at ? formatDate(link.last_clicked_at) : 'Never'}
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Created</span>
                </div>
                <p className="text-sm font-medium text-purple-900 break-words">
                  {formatDate(link.created_at)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Quick Access</h3>
              <div className="space-y-2">
                <a
                  href={shortUrl}
                  className="block text-blue-600 hover:text-blue-800 text-sm hover:underline"
                >
                  {shortUrl}
                </a>
                <p className="text-xs text-blue-700">
                  Share this link to redirect visitors to your target URL
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
