import { useState, useEffect } from 'react';
import { Link as LinkIcon, Trash2, Copy, Search, Plus, ExternalLink } from 'lucide-react';
import { getAllLinks, deleteLink, Link } from '../lib/api';
import { AddLinkModal } from './AddLinkModal';

export function Dashboard() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    try {
      setLoading(true);
      const data = await getAllLinks();
      setLinks(data);
    } catch (error) {
      console.error('Failed to load links:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(code: string) {
    if (!confirm(`Delete link /${code}?`)) return;

    try {
      setDeleteLoading(code);
      await deleteLink(code);
      setLinks(links.filter(link => link.code !== code));
    } catch (error) {
      console.error('Failed to delete link:', error);
      alert('Failed to delete link');
    } finally {
      setDeleteLoading(null);
    }
  }

  function handleCopy(code: string) {
    const url = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  }

  function handleLinkAdded() {
    setShowAddModal(false);
    loadLinks();
  }

  const filteredLinks = links.filter(link =>
    link.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.target_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <LinkIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">URL Shortener</h1>
                  <p className="text-sm text-gray-500">Manage your shortened links</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Link
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code or URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading links...</div>
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                {searchTerm ? (
                  <>
                    <Search className="w-12 h-12 mb-3 text-gray-300" />
                    <p>No links found matching "{searchTerm}"</p>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="mb-2">No links yet</p>
                    <p className="text-sm">Click "Add Link" to create your first shortened URL</p>
                  </>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Short Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Clicked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/code/${link.code}`}
                            className="text-blue-600 hover:text-blue-800 font-mono font-medium"
                          >
                            /{link.code}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 max-w-md">
                          <span className="text-gray-700 truncate" title={link.target_url}>
                            {truncateUrl(link.target_url)}
                          </span>
                          <a
                            href={link.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-900 font-medium">{link.click_count}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-500 text-sm">
                          {formatDate(link.last_clicked_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(link.code)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(link.code)}
                            disabled={deleteLoading === link.code}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Delete link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddLinkModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleLinkAdded}
        />
      )}
    </div>
  );
}
