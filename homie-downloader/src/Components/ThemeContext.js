import { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../Styles/theme';

// Список доступних тем
const themes = [
    { name: 'light', styles: lightTheme },
    { name: 'dark', styles: darkTheme },
    // Додайте більше тем тут, наприклад:
    // { name: 'high-contrast', styles: highContrastTheme },
];

// Функція для визначення системної теми
const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // Початкова тема: з localStorage, системної теми або 'light' за замовчуванням
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme && themes.some(t => t.name === savedTheme) ? savedTheme : getSystemTheme();
    });

    // Функція для перемикання теми
    const toggleTheme = (newTheme) => {
        if (themes.some(t => t.name === newTheme)) {
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        }
    };

    // Оновлення атрибута data-theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Відстеження зміни системної теми
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

    // Отримання стилів для поточної теми
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