import { createContext, useContext, useState, useEffect } from 'react'; 
import { login as loginApi, register as registerApi } from '../services/authService'; 
import { setTokenGetter } from '../services/apiClient';

const AuthContext = createContext(null); 

export function AuthProvider({ children }) { 
  const [token, setToken] = useState(null); 
  const [user, setUser] = useState(null); 

  useEffect(() => { 
    setTokenGetter(() => token); 
  }, [token]);

  const login = async (email, password) => { 
    const result = await loginApi(email, password); 
    setToken(result.token); 
    setUser(result.user); 
    return result; 
  }; 

  const register = async (fullName, email, password, companyName) => { 
    const result = await registerApi(fullName, email, password, companyName); 
    return result; 
  }; 

  const logout = () => { 
    setToken(null); 
    setUser(null); 
  }; 

  const isAuthenticated = !!token; 

  return ( 
    <AuthContext.Provider value={{ token, user, login, register, logout, isAuthenticated }}> 
      {children} 
    </AuthContext.Provider> 
  ); 
} 

export function useAuth() { 
  const context = useContext(AuthContext); 
  if (!context) { 
    throw new Error('useAuth must be used within an AuthProvider'); 
  } 
  return context; 
}
