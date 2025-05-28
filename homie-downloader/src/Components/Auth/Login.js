import React, { useState } from 'react';
import { useAuth } from '../Firebase/AuthContext'; // Переконайтеся, що шлях правильний
import { useNavigate, Link } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import './Login.css';

// Допоміжна функція для валідації email
const isValidEmail = (email) => {
    // Простий регулярний вираз для перевірки формату email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Валідація email
        if (!isValidEmail(email)) {
            setError('Please enter a valid email address.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        // Мінімальна довжина пароля (можна додати більш складні перевірки, якщо потрібно для логіну)
        if (password.length < 6) { // Firebase за замовчуванням вимагає мінімум 6 символів
            setError('Password should be at least 6 characters long.');
            setTimeout(() => setError(''), 3000);
            return;
        }

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
                            placeholder="Enter your email"
                        />
                        <label></label>
                        <span className="input-border"></span>
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                        <label></label>
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