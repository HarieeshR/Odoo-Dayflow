import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../services/db";
import * as api from "../services/api";

// ---------------------------------------------------------------------------
// Drives the actual "dark mode" — not just a stored preference. Setting the
// "dark" class on <html> flips every navy-*/mist-100/surface CSS token
// defined in index.css, which is what the whole app's styling is built on.
// The index.html inline script applies the saved value before first paint
// so there's no flash of the wrong theme on reload.
// ---------------------------------------------------------------------------

const ThemeContext = createContext(null);

function applyTheme(mode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = db.get().settings?.appearance === "dark" ? "dark" : "light";
    applyTheme(saved);
    return saved;
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = async (mode) => {
    setThemeState(mode);
    try {
      await api.updateSettings({ appearance: mode });
    } catch (e) {
      // Theme is still applied locally even if persisting the
      // preference to the "server" fails.
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
