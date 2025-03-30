import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import authService from '../../services/authService';
import '../../styles/pages/LoginPage.css';

const SignupPage: React.FC = () => {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		// Basic validation
		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		setIsLoading(true);

		try {
			// Use authService instead of direct fetch
			const data = await authService.signup(username, email, password);

			// Registration successful - log the user in
			login(data.token, data.userId, data.username, data.roles || ['user'], data.permissions || []);

			// Redirect to home page
			navigate('/');
		} catch (err) {
			console.error('Registration error:', err);
			setError(err instanceof Error ? err.message : 'An error occurred during registration');
		} finally {
			setIsLoading(false);
		}
	};

	// Toggle password visibility
	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	// Toggle confirm password visibility
	const toggleConfirmPasswordVisibility = () => {
		setShowConfirmPassword(!showConfirmPassword);
	};

	return (
		<div className="login-container">
			{/* Navbar-like top section */}
			<header className="login-top-header">
				<Link to="/" className="login-home-link">PixelBoard</Link>
				<ThemeToggle />
			</header>

			<div className="login-frame">
				<div className="login-frame-header">
					<h1 className="login-logo">PixelBoard</h1>
				</div>

				<div className="login-form-container">
					<h2>Create an account</h2>

					{error && <div className="login-error">{error}</div>}

					<form className="login-form" onSubmit={handleSubmit}>
						<div className="form-group">
							<label htmlFor="username">Username</label>
							<input
								type="text"
								id="username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								placeholder="Choose a username"
								minLength={3}
								maxLength={20}
							/>
						</div>

						<div className="form-group">
							<label htmlFor="email">Email</label>
							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								placeholder="Enter your email"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="password">Password</label>
							<div className="password-input-container">
								<input
									type={showPassword ? "text" : "password"}
									id="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									placeholder="Create a password"
									minLength={6}
								/>
								<button
									type="button"
									className="password-toggle-btn"
									onClick={togglePasswordVisibility}
									aria-label={showPassword ? "Hide password" : "Show password"}
								>
									{showPassword ?
										<i className="password-icon hide-password">👁️</i> :
										<i className="password-icon show-password">👁️‍🗨️</i>
									}
								</button>
							</div>
						</div>

						<div className="form-group">
							<label htmlFor="confirmPassword">Confirm Password</label>
							<div className="password-input-container">
								<input
									type={showConfirmPassword ? "text" : "password"}
									id="confirmPassword"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
									placeholder="Confirm your password"
									minLength={6}
								/>
								<button
									type="button"
									className="password-toggle-btn"
									onClick={toggleConfirmPasswordVisibility}
									aria-label={showConfirmPassword ? "Hide password" : "Show password"}
								>
									{showConfirmPassword ?
										<i className="password-icon hide-password">👁️</i> :
										<i className="password-icon show-password">👁️‍🗨️</i>
									}
								</button>
							</div>
						</div>

						<button
							type="submit"
							className="login-button"
							disabled={isLoading}
						>
							{isLoading ? 'Creating account...' : 'Create account'}
						</button>
					</form>

					<div className="login-footer">
						<p>Already have an account? <Link to="/login">Log in</Link></p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SignupPage;
