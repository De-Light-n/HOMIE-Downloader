import React, { useState } from 'react';
import { useAuth } from '../Firebase/AuthContext'; // Переконайтеся, що шлях правильний
import { useNavigate, Link } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import './Signup.css';

// Допоміжна функція для валідації email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Допоміжна функція для валідації пароля
const isValidPassword = (password) => {
    // Мінімум 8 символів, принаймні одна велика літера, одна мала літера, одна цифра та один спеціальний символ
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#-])[A-Za-z\d@$!%*?&_#-]{8,}$/;
    return passwordRegex.test(password);
};

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Валідація email
        if (!isValidEmail(email)) {
            setError('Please enter a valid email address.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        // Валідація складності пароля
        if (!isValidPassword(password)) {
            setError(
                'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character (e.g., @$!%*?&_#-).'
            );
            setTimeout(() => setError(''), 7000); // Довший час для складнішого повідомлення
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password);
            navigate('/');
        } catch (err) {
            setError('Failed to create an account: ' + err.message);
            setTimeout(() => setError(''), 5000);
        }
        setLoading(false);
    };

    const handleGoogleSignup = async () => {
        try {
            setError('');
            setLoading(true);
            await googleLogin();
            navigate('/');
        } catch (err) {
            setError('Failed to sign up with Google: ' + err.message);
            setTimeout(() => setError(''), 5000);
        }
        setLoading(false);
    };

    return (
        <div className="signup-container">
            <div className="signup-background"></div>
            <div className="signup-card">
                <div className="signup-header">
                    <h2>Create Account</h2>
                    <p>Join us to start your journey</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="signup-form">
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

                    <div className="form-group">
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Enter your password again"
                        />
                        <label></label>
                        <span className="input-border"></span>
                    </div>

                    <button type="submit" disabled={loading} className="signup-button">
                        {loading ? (
                            <span className="button-loader"></span>
                        ) : (
                            'Sign Up'
                        )}
                    </button>
                </form>

                <div className="divider">
                    <span>or sign up with</span>
                </div>

                <button
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    className="google-signup-button"
                >
                    <FaGoogle className="google-icon" />
                    {loading ? 'Signing up...' : 'Google'}
                </button>

                <div className="signup-footer">
                    <span>Already have an account? <Link to="/login">Log In</Link></span>
                </div>
            </div>
        </div>
    );
};

export default Signup;