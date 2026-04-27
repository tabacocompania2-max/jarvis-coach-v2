import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange, getAuthToken } from '../services/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const newToken = await getAuthToken();
          setToken(newToken);
        } catch (error) {
          console.error('Error getting auth token:', error);
          setToken(null);
        }
      } else {
        setToken(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, token };
}
