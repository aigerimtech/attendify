import { createContext, useContext, useState, useEffect } from "react";
import { getMe, getToken } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem("attendify_user") || "null")
  );
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    if (getToken() && !user) {
      getMe()
        .then(data => {
          setUser(data);
          localStorage.setItem("attendify_user", JSON.stringify(data));
        })
        .catch(() => {
          localStorage.removeItem("attendify_token");
          localStorage.removeItem("attendify_user");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const saveLogin = (tokenData) => {
    localStorage.setItem("attendify_token", tokenData.access_token);
    const userData = {
      id: tokenData.user_id,
      full_name: tokenData.full_name,
      student_number: tokenData.student_number,
      department: tokenData.department,
      face_enrolled: tokenData.face_enrolled,
      role: tokenData.role,
    };
    localStorage.setItem("attendify_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("attendify_token");
    localStorage.removeItem("attendify_user");
    setUser(null);
  };

  const refreshUser = () =>
    getMe().then(data => {
      setUser(data);
      localStorage.setItem("attendify_user", JSON.stringify(data));
    });

  return (
    <AuthContext.Provider value={{ user, loading, saveLogin, logout, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
