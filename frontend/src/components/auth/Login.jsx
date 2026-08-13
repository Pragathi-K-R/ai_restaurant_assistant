/**
 * Login Page — Premium Split-Screen Restaurant AI Experience.
 * Features:
 * - Left: High-resolution dark luxury restaurant backdrop, RestaurantAI branding,
 *   tagline "Turn Restaurant Data Into Smarter Decisions", and 3 feature highlights.
 * - Right: Glassmorphism login card with Welcome Back, Email, Password (show/hide),
 *   Remember Me, Forgot Password, Sign In, Quick Demo Fill, and Create Account link.
 * - Role-based redirect: 'customer' -> /customer-dashboard, others -> /dashboard.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname;

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const fillDemoAdmin = () => {
    setFormData({ email: 'admin@restaurant.com', password: 'Admin@123' });
    setErrors({});
    toast.success('Demo admin credentials filled! 🔑');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(formData.email, formData.password);
      toast.success('Welcome back to RestaurantAI! 🍽️');

      // Determine redirect path based on user role
      const userRole = res?.user?.role || JSON.parse(localStorage.getItem('user') || '{}')?.role;
      let destination = from && from !== '/login' ? from : '/dashboard';

      if (userRole === 'customer') {
        destination = '/customer-dashboard';
      }

      navigate(destination, { replace: true });
    } catch (error) {
      const message = error.response?.data?.detail || 'Invalid email or password. Please check your credentials.';
      toast.error(message);
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      
      {/* ─── LEFT HERO SECTION ────────────────────────────────────────── */}
      <div className="auth-split-left">
        {/* Dark overlay & glowing ambient background orb */}
        <div className="auth-hero-overlay"></div>
        <div className="auth-hero-glow-orb"></div>

        <div className="auth-hero-content">
          {/* Brand Logo & Version Badge */}
          <div className="auth-hero-brand">
            <div className="auth-hero-logo-icon">🍽️</div>
            <div>
              <span className="auth-hero-brand-title">RestaurantAI</span>
              <span className="auth-hero-brand-tag">✨ AI RESTAURANT PLATFORM v2.0</span>
            </div>
          </div>

          {/* Main Tagline */}
          <div className="auth-hero-headline">
            <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.2, color: '#ffffff', marginBottom: '14px', letterSpacing: '-0.5px' }}>
              Turn Restaurant Data Into <br />
              <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Smarter Decisions
              </span>
            </h1>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.65, maxWidth: '520px' }}>
              Empowering restaurant owners, managers, and staff with real-time operational analytics, 
              demand forecasting, and an intelligent Gemini AI concierge.
            </p>
          </div>

          {/* 3 Feature Highlights */}
          <div className="auth-hero-features">
            <div className="auth-feature-card">
              <div className="auth-feature-icon">🤖</div>
              <div>
                <h4>AI Demand Forecasting & RAG</h4>
                <p>7-day statistical trend predictions and ChromaDB vector search for menu & operational policies.</p>
              </div>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon">📊</div>
              <div>
                <h4>Real-Time Operational Analytics</h4>
                <p>Live KPI tracking for revenue, orders, low inventory alerts, and food waste reduction.</p>
              </div>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon">👥</div>
              <div>
                <h4>Customer RFM & Loyalty Hub</h4>
                <p>K-Means customer value segmentation, order history tracking, and reward points management.</p>
              </div>
            </div>
          </div>

          {/* Social Proof Pill */}
          <div className="auth-hero-footer">
            <i className="bi bi-star-fill" style={{ color: '#f59e0b', fontSize: '14px' }}></i>
            <span>Trusted by 500+ Top Restaurants · 99.9% Operational Uptime</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT FORM SECTION ───────────────────────────────────────── */}
      <div className="auth-split-right">
        <div className="auth-glass-card">
          
          {/* Form Header */}
          <div style={{ marginBottom: '28px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px' }}>👋</span>
              <span
                style={{
                  background: 'rgba(249, 115, 22, 0.15)',
                  color: '#f97316',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  letterSpacing: '0.5px'
                }}
              >
                RESTAURANT PORTAL
              </span>
            </div>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.5px' }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px' }}>
              Sign in to access your dashboard & operational insights
            </p>
          </div>

          {/* Error Alert Box */}
          {errors.general && (
            <div
              className="alert alert-danger"
              style={{
                marginBottom: '22px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px'
              }}
            >
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '16px', color: '#ef4444' }}></i>
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            
            {/* Email Address Field */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#cbd5e1', marginBottom: '8px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className={errors.email ? 'error' : ''}
                  placeholder="admin@restaurant.com or cust1@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  autoFocus
                  style={{
                    width: '100%',
                    height: '50px',
                    padding: '0 16px 0 46px',
                    background: 'rgba(10, 12, 18, 0.65)',
                    border: errors.email ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.25s ease'
                  }}
                  onFocus={(e) => {
                    if (!errors.email) {
                      e.target.style.borderColor = '#f97316';
                      e.target.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.18)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.email) {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                <i className="bi bi-envelope" style={{ position: 'absolute', left: '16px', color: '#64748b', fontSize: '18px', pointerEvents: 'none' }}></i>
              </div>
              {errors.email && (
                <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="bi bi-exclamation-circle"></i> {errors.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label htmlFor="password" style={{ fontWeight: 600, fontSize: '13px', color: '#cbd5e1', margin: 0 }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '12px', color: '#f97316', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.color = '#fb923c'}
                  onMouseLeave={(e) => e.target.style.color = '#f97316'}
                >
                  Forgot password?
                </Link>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={errors.password ? 'error' : ''}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    height: '50px',
                    padding: '0 48px 0 46px',
                    background: 'rgba(10, 12, 18, 0.65)',
                    border: errors.password ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.25s ease'
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = '#f97316';
                      e.target.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.18)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.password) {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                />
                <i className="bi bi-lock" style={{ position: 'absolute', left: '16px', color: '#64748b', fontSize: '18px', pointerEvents: 'none' }}></i>
                
                {/* Interactive Show/Hide Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#f97316'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                </button>
              </div>
              {errors.password && (
                <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="bi bi-exclamation-circle"></i> {errors.password}
                </span>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    accentColor: '#f97316',
                    width: '17px',
                    height: '17px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                Remember me on this device
              </label>
            </div>

            {/* Submit Sign In Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: '52px',
                background: 'linear-gradient(135deg, #f97316 0%, #d97706 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15px',
                border: 'none',
                borderRadius: '12px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 25px rgba(249, 115, 22, 0.35)',
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isLoading ? 0.75 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(249, 115, 22, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.35)';
                }
              }}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right" style={{ fontSize: '18px' }}></i>
                  <span>Sign In to Platform</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Auto-Fill Helper */}
          <div
            style={{
              marginTop: '22px',
              padding: '12px 16px',
              background: 'rgba(249, 115, 22, 0.08)',
              borderRadius: '14px',
              border: '1px solid rgba(249, 115, 22, 0.22)',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <p style={{ fontSize: '12px', color: '#f97316', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🔑</span> Demo Admin Account
              </p>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                admin@restaurant.com / Admin@123
              </p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={fillDemoAdmin}
              style={{
                fontSize: '11px',
                padding: '4px 12px',
                borderRadius: '8px',
                background: 'rgba(249, 115, 22, 0.15)',
                color: '#f97316',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                fontWeight: 700
              }}
            >
              Auto-Fill
            </button>
          </div>

          {/* Create Account Link */}
          <p className="auth-footer" style={{ marginTop: '22px', fontSize: '14px', color: '#94a3b8', textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#f97316', fontWeight: 700, textDecoration: 'none' }}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
