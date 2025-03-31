import React from 'react';
import Navbar from './Navbar';
import Container from './Container';
import '../../styles/layout/Layout.css';

interface LayoutProps {
	children: React.ReactNode;
	title?: string;
	showNavbar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
	children,
	title,
	showNavbar = true
}) => {
	// Update page title if provided
	React.useEffect(() => {
		if (title) {
			document.title = `${title} | PixelBoard`;
		}
	}, [title]);

	return (
		<div className="layout">
			{showNavbar && <Navbar />}
			<main className="layout-main">
				<Container>
					{title && <h1 className="page-title">{title}</h1>}
					{children}
				</Container>
			</main>
		</div>
	);
};

export default Layout;