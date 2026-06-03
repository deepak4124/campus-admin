'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

export default function HomePage() {
  const [session, setSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const searchStudents = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/students/search?q=${searchQuery}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-slate-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              School Admin Panel
            </h1>
            <p className="text-slate-400 mt-2">Welcome, {session?.user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Sign Out
          </button>
        </header>

        <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Student Directory Search</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
              placeholder="Search students by name..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchStudents}
              disabled={loading || !searchQuery}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Results</h3>
            {results.length > 0 ? (
              <ul className="space-y-3">
                {results.map((student: any) => (
                  <li key={student.student_id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex justify-between items-center hover:bg-slate-900 transition-colors">
                    <div>
                      <p className="font-semibold text-lg">{student.first_name} {student.last_name}</p>
                      <p className="text-sm text-slate-400">Adm No: {student.admission_no} • Class: {student.class_name}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {student.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-center py-8">No students found. Try searching for something else.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
