import { createContext, useContext, useState, useEffect } from 'react';
import {
    oceanicBlissTheme,
    crimsonNightTheme,
    halloweenTheme,
    horrorTheme,
    helloKittyTheme,
    cyberpunkNeonTheme,
    noirCinemaTheme,
    sunsetGlowTheme,
    vintagePaperTheme,
    deepForestTheme,
    // --- HORROR THEMES ROUND 2 IMPORTS ---
    staticVoidTheme,
    eldritchDepthsTheme
} from '../Styles/theme';

const themes = [
    { name: 'oceanic-bliss', styles: oceanicBlissTheme },
    { name: 'crimson-night', styles: crimsonNightTheme },
    { name: 'halloween', styles: halloweenTheme },
    { name: 'horror', styles: horrorTheme },
    { name: 'hello-kitty', styles: helloKittyTheme },
    { name: 'cyberpunk-neon', styles: cyberpunkNeonTheme },
    { name: 'noir-cinema', styles: noirCinemaTheme },
    { name: 'sunset-glow', styles: sunsetGlowTheme },
    { name: 'vintage-paper', styles: vintagePaperTheme },
    { name: 'deep-forest', styles: deepForestTheme },
    { name: 'static-void', styles: staticVoidTheme },
    { name: 'eldritch-depths', styles: eldritchDepthsTheme },
];

const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'crimson-night'; // Example: default dark theme
    }
    return 'oceanic-bliss'; // Example: default light theme
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme && themes.some(t => t.name === savedTheme) ? savedTheme : getSystemTheme();
    });

    const toggleTheme = (newTheme) => {
        if (themes.some(t => t.name === newTheme)) {
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        }
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (!localStorage.getItem('theme')) {
                const newSystemThemeName = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'crimson-night' : 'oceanic-bliss';
                if (themes.some(t => t.name === newSystemThemeName)) {
                    setTheme(newSystemThemeName);
                }
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const themeStyles = themes.find(t => t.name === theme)?.styles;

    return (
        <ThemeContext.Provider value={{ theme, themes: themes.map(t => t.name), toggleTheme, themeStyles }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}