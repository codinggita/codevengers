import { createContext, useContext } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ theme, children }) {
  const style = {
    '--theme-accent': theme.colors.accent,
    '--theme-accent-secondary': theme.colors.accentSecondary,
    '--theme-glow': theme.colors.glow,
    '--theme-floral': theme.colors.floral,
  };

  return (
    <ThemeContext.Provider value={theme}>
      <div className={`theme theme-${theme.id}`} data-theme={theme.id} style={style}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeAmbient() {
  const theme = useTheme();

  if (!theme || theme.backgroundMotif !== 'wedding-hall') {
    return null;
  }

  return (
    <div
      className={`theme-ambient theme-ambient-${theme.ambientDecoration}`}
      aria-hidden="true"
    >
      {theme.ambientDecoration === 'petals' &&
        Array.from({ length: 7 }, (_, index) => (
          <span className="theme-petal" key={index} />
        ))}
    </div>
  );
}
