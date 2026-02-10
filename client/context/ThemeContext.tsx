import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { getTheme, setTheme as saveTheme } from '@/lib/storage';
import { Colors } from '@/constants/theme';

type ThemeName = keyof typeof Colors;

interface ThemeContextType {
  theme: typeof Colors.dark;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: Colors.dark,
  themeName: 'dark',
  setTheme: () => console.warn('ThemeProvider not used'),
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState(Colors.dark);
  const [themeName, setThemeNameState] = useState<ThemeName>('dark');

  useEffect(() => {
    const loadTheme = async () => {
      let storedTheme = await getTheme() as ThemeName;
      if (storedTheme === 'system') {
        const colorScheme = Appearance.getColorScheme();
        storedTheme = colorScheme === 'dark' ? 'dark' : 'light';
      }
      if (Colors[storedTheme]) {
        setThemeState(Colors[storedTheme]);
        setThemeNameState(storedTheme);
      }
    };

    loadTheme();

    const subscription = Appearance.addChangeListener(() => {
      loadTheme();
    });

    return () => subscription.remove();
  }, []);

  const handleSetTheme = async (newThemeName: ThemeName) => {
    if (Colors[newThemeName]) {
      await saveTheme(newThemeName);
      setThemeState(Colors[newThemeName]);
      setThemeNameState(newThemeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
