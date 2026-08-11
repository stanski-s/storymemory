"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface User {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: String) => Promise<void>;
  register: (email: string, password: String, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  getSseTicket: () => Promise<string | null>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Attempt refresh token on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          setUser(data.user);
        } else {
          setAccessToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to restore auth session:", err);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (email: string, password: String) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Invalid email or password");
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (email: string, password: String, displayName: string) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Registration failed");
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      let token = accessToken;

      const headers = new Headers(options.headers || {});
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      let response = await fetch(url, { ...options, headers, credentials: "include" });

      // Handle token expiration by attempting refresh once
      if (response.status === 401) {
        try {
          const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            setAccessToken(data.accessToken);
            setUser(data.user);
            headers.set("Authorization", `Bearer ${data.accessToken}`);
            response = await fetch(url, { ...options, headers, credentials: "include" });
          } else {
            setAccessToken(null);
            setUser(null);
          }
        } catch (e) {
          setAccessToken(null);
          setUser(null);
        }
      }

      return response;
    },
    [accessToken]
  );

  const getSseTicket = useCallback(async (): Promise<string | null> => {
    try {
      const res = await authenticatedFetch(`${API_BASE}/api/auth/sse-ticket`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        return data.ticket;
      }
      return null;
    } catch (e) {
      console.error("Failed to get SSE ticket:", e);
      return null;
    }
  }, [authenticatedFetch]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        getSseTicket,
        authenticatedFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
