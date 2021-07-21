import React from 'react';
import { GraphiQL } from 'graphiql';
import useColorScheme from './useColorScheme';

const ColorSchemeToggle = () => {
  const { isDark, setIsDark } = useColorScheme();

  return React.createElement(GraphiQL.Button, {
    label: 'Theme',
    title: 'Toggle Dark Mode',
    onClick: () => setIsDark(!isDark),
  });
};

export default ColorSchemeToggle;
