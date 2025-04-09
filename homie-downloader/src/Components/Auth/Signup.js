import React, { useState } from 'react';
import { useAuth } from '../Firebase/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import './Signup.css';
import backgroundVideo from './176434-855480487_small.mp4';

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
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
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

                    <div className="form-group">
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder=" "
                        />
                        <label>Confirm Password</label>
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