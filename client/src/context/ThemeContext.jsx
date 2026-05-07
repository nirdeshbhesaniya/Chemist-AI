import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Retrieve standard initial theme string
        return localStorage.getItem('chemist_theme') || 'dark';
    });

    useEffect(() => {
        // Apply the requested dataset directly to documentElement (<html>)
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('chemist_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
