import { useState } from 'react';
import { X } from 'lucide-react';
import { createLink } from '../lib/api';

interface AddLinkModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddLinkModal({ onClose, onSuccess }: AddLinkModalProps) {
  const [targetUrl, setTargetUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [codeError, setCodeError] = useState('');

  function validateUrl(url: string): boolean {
    if (!url) {
      setUrlError('URL is required');
      return false;
    }
    try {
      new URL(url);
      setUrlError('');
      return true;
    } catch {
      setUrlError('Invalid URL format');
      return false;
    }
  }

  function validateCode(code: string): boolean {
    if (!code) {
      setCodeError('');
      return true;
    }
    if (!/^[A-Za-z0-9]{6,8}$/.test(code)) {
      setCodeError('Code must be 6-8 alphanumeric characters');
      return false;
    }
    setCodeError('');
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const urlValid = validateUrl(targetUrl);
    const codeValid = validateCode(customCode);

    if (!urlValid || !codeValid) {
      return;
    }

    try {
      setLoading(true);
      await createLink({
        target_url: targetUrl,
        code: customCode || undefined,
      });
      onSuccess();
    } catch (err: any) {
      if (err.status === 409) {
        setError('This code is already taken. Please choose another one.');
      } else {
        setError(err.message || 'Failed to create link');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Link</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="targetUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Target URL *
            </label>
            <input
              id="targetUrl"
              type="text"
              value={targetUrl}
              onChange={(e) => {
                setTargetUrl(e.target.value);
                if (e.target.value) validateUrl(e.target.value);
              }}
              onBlur={() => targetUrl && validateUrl(targetUrl)}
              placeholder="https://example.com"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                urlError ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {urlError && (
              <p className="mt-1 text-sm text-red-600">{urlError}</p>
            )}
          </div>

          <div>
            <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-1">
              Custom Code (Optional)
            </label>
            <input
              id="customCode"
              type="text"
              value={customCode}
              onChange={(e) => {
                setCustomCode(e.target.value);
                if (e.target.value) validateCode(e.target.value);
              }}
              onBlur={() => customCode && validateCode(customCode)}
              placeholder="e.g., docs123 (6-8 chars)"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                codeError ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
              maxLength={8}
            />
            {codeError && (
              <p className="mt-1 text-sm text-red-600">{codeError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to generate a random code
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !!urlError || !!codeError}
            >
              {loading ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
