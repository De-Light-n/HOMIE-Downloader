import { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme, highContrastTheme, ecoTheme, floralTheme } from '../Styles/theme';

const themes = [
    { name: 'light', styles: lightTheme },
    { name: 'dark', styles: darkTheme },
    { name: 'high-contrast', styles: highContrastTheme },
    { name: 'eco', styles: ecoTheme },
    { name: 'floral', styles: floralTheme },
];

const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
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
            const newSystemTheme = getSystemTheme();
            if (!localStorage.getItem('theme')) {
                setTheme(newSystemTheme);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const themeStyles = themes.find(t => t.name === theme)?.styles || lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, themes: themes.map(t => t.name), toggleTheme, themeStyles }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}