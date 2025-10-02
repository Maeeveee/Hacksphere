"use client";

import { useState } from 'react';
import { getAllStasiun } from '@/lib/supabase/queries';
import { Button } from "@/components/ui/button";

export default function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing connection...');
      console.log('Environment vars:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'Set' : 'Not set'
      });

      const { data, error } = await getAllStasiun();
      
      console.log('Result:', { data, error });
      setResult({ data, error, success: !error });
    } catch (err) {
      console.error('Catch error:', err);
      setResult({ error: err, success: false });
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Supabase Connection</h1>
      
      <Button onClick={testConnection} disabled={loading}>
        {loading ? 'Testing...' : 'Test Connection'}
      </Button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}