import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();


 const handleSubmit = async (e) => {
    e.preventDefault();

    await login(email, password);

    const roles = JSON.parse(localStorage.getItem("roles"));

    // ✅ Redirect based on role
    if (roles?.includes("cashier")) {
      navigate("/");
    } else if (roles?.includes("admin")) {
      navigate("/admin");
    } else {
      navigate("/customer/profile");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white swiss-grid-pattern">
      <div className="w-full max-w-md p-12 bg-white border-4 border-black">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">
            Retail<span className="text-[#FF3000]">Ease</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mt-3">
            Point of Sale System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-[#FF3000] text-white px-4 py-3 text-sm font-bold uppercase tracking-wide">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-black mb-2 block">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 bg-white border-2 border-black text-black font-medium
                placeholder:text-gray-400 focus:border-[#FF3000] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-black mb-2 block">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white border-2 border-black text-black font-medium
                placeholder:text-gray-400 focus:border-[#FF3000] focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full h-14 bg-black text-white font-black uppercase tracking-widest text-sm
              hover:bg-[#FF3000] transition-colors duration-150 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-black">
          <p className="text-xs text-gray-500 text-center uppercase tracking-wider">
            Staff & Customer Login
          </p>
        </div>
      </div>
    </div>
  );
}
