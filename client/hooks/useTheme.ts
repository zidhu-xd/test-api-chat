import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { getTheme } from '@/lib/storage';
import { Colors } from '@/constants/theme';

export const useTheme = () => {
  const [theme, setTheme] = useState(Colors.dark);
  const [themeName, setThemeName] = useState('dark');

  useEffect(() => {
    const loadTheme = async () => {
      let storedTheme = await getTheme();
      if (storedTheme === 'system') {
        const colorScheme = Appearance.getColorScheme();
        storedTheme = colorScheme === 'dark' ? 'dark' : 'light';
      }
      setTheme(Colors[storedTheme as keyof typeof Colors] || Colors.dark);
      setThemeName(storedTheme);
    };

    loadTheme();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      loadTheme();
    });

    return () => subscription.remove();
  }, []);

  return { theme, themeName };
};