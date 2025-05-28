import React from 'react';
import { useLocation } from 'react-router-dom';
import '../Styles/themes.css';

function Background() {
    const location = useLocation();
    const excludePaths = ['/login', '/signup']; // Сторінки без фону
    if (excludePaths.includes(location.pathname)) {
        return null;
    }

    return (
        <div className="neonBackground">
            <div className="glowEffect purpleGlow"></div>
            <div className="glowEffect pinkGlow"></div>
            <div className="glowEffect blueGlow"></div>
            <div className="gridOverlay"></div>
        </div>
    );
}

export default Background;