import { useEffect, useMemo } from 'react';
import { useMediaQuery } from 'react-responsive';
import createPersistedState from 'use-persisted-state';

const useColorSchemeState = createPersistedState('colorScheme');

export default function useColorScheme() {
  const systemPrefersDark = useMediaQuery(
    {
      query: '(prefers-color-scheme: dark)',
    },
    undefined,
  );
  const [isDark, setIsDark] = useColorSchemeState();
  const value = useMemo(
    () => (isDark === undefined ? !!systemPrefersDark : isDark),
    [isDark, systemPrefersDark],
  );
  useEffect(() => {
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [value]);
  return {
    isDark: value,
    setIsDark,
  };
}
