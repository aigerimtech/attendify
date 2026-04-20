import { createContext, useContext, useState, useEffect } from "react";
import { lightTheme, darkTheme } from "../styles/tokens";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("attendify-theme") === "dark"
  );
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDark(prev => {
      localStorage.setItem("attendify-theme", !prev ? "dark" : "light");
      return !prev;
    });
  };

  useEffect(() => {
    document.body.style.background = theme.bg;
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
