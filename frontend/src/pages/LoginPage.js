import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Support both react-router state and URL ?from= param (used by 401 interceptor)
  const searchParams = new URLSearchParams(location.search);
  const fromParam = searchParams.get('from');
  const isExpired = searchParams.get('expired') === '1';
  const from = fromParam || location.state?.from?.pathname || '/shop';

  // Show session expiry notice once on mount
  React.useEffect(() => {
    if (isExpired) {
      toast.error('Your session has expired. Please log in again.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Logged in successfully');
      } else {
        await register(email, password, name);
        toast.success('Account created successfully');
      }
      navigate(from, { replace: true });
    } catch (error) {
      const message = error.response?.data?.detail || 'An error occurred';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/auth/google/session`,
          { access_token: tokenResponse.access_token },
          { withCredentials: true }
        );
        // Login the user in the context
        toast.success('Google login successful');
        
        // Set the user in the AuthContext manually so we don't need a page reload
        if (setUser && res.data && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('etlawm_user', JSON.stringify(res.data.user));
        }
        // Store session token for Authorization header fallback (cross-origin cookie fix)
        if (res.data && res.data.session_token) {
          localStorage.setItem('etlawm_session_token', res.data.session_token);
        }
        
        // Client-side navigation is much faster than window.location.href
        navigate(from, { replace: true });
      } catch (err) {
        toast.error('Google login failed. Please try again.');
        setLoading(false);
      }
    },
    onError: () => toast.error('Google login failed'),
  });

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Image Side */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1770981667079-d59bbacc0739"
          alt="Beauty"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12" data-testid="auth-form-container">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link to="/" className="font-display text-4xl tracking-tight inline-block mb-4">
              ETLAWM
            </Link>
            <h2 className="text-2xl font-normal mb-2" data-testid="auth-form-title">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-neutral-600">
              {isLogin ? 'Login to continue your journey' : 'Join the ETLAWM community'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-xs uppercase tracking-widest mb-2 block">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="border-b border-neutral-300 focus:border-black bg-transparent rounded-none px-0 py-4 placeholder:text-neutral-400 focus:ring-0 transition-colors"
                  placeholder="Enter your name"
                  data-testid="name-input"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-widest mb-2 block">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-b border-neutral-300 focus:border-black bg-transparent rounded-none px-0 py-4 placeholder:text-neutral-400 focus:ring-0 transition-colors"
                placeholder="Enter your email"
                data-testid="email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-widest mb-2 block">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-b border-neutral-300 focus:border-black bg-transparent rounded-none px-0 py-4 placeholder:text-neutral-400 focus:ring-0 transition-colors"
                placeholder="Enter your password"
                data-testid="password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-all duration-300 rounded-none px-8 py-6 uppercase tracking-widest text-xs"
              data-testid="submit-button"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500 uppercase tracking-widest text-xs">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-transparent text-black border border-black hover:bg-black hover:text-white transition-all duration-300 rounded-none px-8 py-6 uppercase tracking-widest text-xs"
            data-testid="google-login-button"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm hover:text-gold transition-colors"
              data-testid="toggle-auth-mode"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;