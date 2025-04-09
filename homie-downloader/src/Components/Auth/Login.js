import React, { useState } from 'react';
import { useAuth } from '../Firebase/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import './Login.css';
import backgroundVideo from './176434-855480487_small.mp4';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Failed to log in: ' + err.message);
            setTimeout(() => setError(''), 5000);
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await googleLogin();
            navigate('/');
        } catch (err) {
            setError('Failed to log in with Google: ' + err.message);
            setTimeout(() => setError(''), 5000);
        }
        setLoading(false);
    };

    return (
        <div className="login-container">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="login-video-background"
            >
                <source src={backgroundVideo} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="login-background"></div>
            <div className="login-card">
                <div className="login-header">
                    <h2>Welcome Back</h2>
                    <p>Sign in to continue your journey</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder=" "
                        />
                        <label>Email</label>
                        <span className="input-border"></span>
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder=" "
                        />
                        <label>Password</label>
                        <span className="input-border"></span>
                    </div>

                    <button type="submit" disabled={loading} className="login-button">
                        {loading ? (
                            <span className="button-loader"></span>
                        ) : (
                            'Log In'
                        )}
                    </button>
                </form>

                <div className="divider">
                    <span>or continue with</span>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="google-login-button"
                >
                    <FaGoogle className="google-icon" />
                    {loading ? 'Signing in...' : 'Google'}
                </button>

                <div className="login-footer">
                    <span>New here? <Link to="/signup">Create account</Link></span>
                    <Link to="/forgot-password">Forgot password?</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;