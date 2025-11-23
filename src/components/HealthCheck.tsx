import { useEffect, useState } from 'react';
import { Activity, Server, Clock, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HealthData {
  ok: boolean;
  version: string;
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
    responseTime: number;
  };
}

export function HealthCheck() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
  }, []);

  async function checkHealth() {
    const startTime = performance.now();

    try {
      const { error } = await supabase.from('links').select('id').limit(1);
      const responseTime = Math.round(performance.now() - startTime);

      const healthData: HealthData = {
        ok: !error,
        version: '1.0',
        timestamp: new Date().toISOString(),
        uptime: performance.now() / 1000,
        database: {
          connected: !error,
          responseTime,
        },
      };

      setHealth(healthData);
    } catch (err) {
      setHealth({
        ok: false,
        version: '1.0',
        timestamp: new Date().toISOString(),
        uptime: performance.now() / 1000,
        database: {
          connected: false,
          responseTime: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Checking system health...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${health?.ok ? 'bg-green-100' : 'bg-red-100'}`}>
                <Activity className={`w-6 h-6 ${health?.ok ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Health Check</h1>
                <p className="text-sm text-gray-500">Real-time system status and metrics</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-6 rounded-lg border ${
                health?.ok
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      health?.ok ? 'text-green-900' : 'text-red-900'
                    }`}>
                      System Status
                    </p>
                    <p className={`text-2xl font-bold ${
                      health?.ok ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {health?.ok ? 'Healthy' : 'Unhealthy'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${
                    health?.ok ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Server className={`w-6 h-6 ${
                      health?.ok ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Session Uptime</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {health && formatUptime(health.uptime)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg border ${
              health?.database.connected
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <Database className={`w-5 h-5 ${
                  health?.database.connected ? 'text-green-600' : 'text-red-600'
                }`} />
                <h3 className={`font-semibold ${
                  health?.database.connected ? 'text-green-900' : 'text-red-900'
                }`}>
                  Database Connection
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className={`font-medium ${
                    health?.database.connected ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {health?.database.connected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Response Time</p>
                  <p className="font-medium text-gray-900">
                    {health?.database.responseTime}ms
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">System Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Version</span>
                  <span className="font-mono text-gray-900">{health?.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timestamp</span>
                  <span className="font-mono text-gray-900 text-sm">
                    {health && new Date(health.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Environment</span>
                  <span className="font-mono text-gray-900">Production</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={checkHealth}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Status
              </button>
              <a
                href="/"
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
