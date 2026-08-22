import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as api from "../services/api";

// ---------------------------------------------------------------------------
// Stands in for the app's existing authentication/session layer.
//
// The plan is explicit: no login/signup screens, no second auth system —
// the employee is assumed already authenticated, and every API call reads
// identity from "the session" rather than the caller. This context is that
// session: it loads the current employee on mount (as `getMe()` would after
// reading a real cookie/token) and exposes refresh + logout so the rest of
// the app never has to know how identity actually gets resolved.
// ---------------------------------------------------------------------------

const EmployeeContext = createContext(null);

export function EmployeeProvider({ children }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggedOut, setLoggedOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await api.getMe();
      setEmployee(me);
    } catch (e) {
      setError(e.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshEmployee = useCallback(async () => {
    const me = await api.getMe();
    setEmployee(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    // Hands control back to the app's existing auth entry point.
    // No Dayflow-specific login screen is created here per the spec.
    setLoggedOut(true);
  }, []);

  return (
    <EmployeeContext.Provider value={{ employee, loading, error, refreshEmployee, logout, loggedOut, reload: load }}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  return useContext(EmployeeContext);
}
