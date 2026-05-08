import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, OperationType } from '../types';
import { handleFirestoreError } from '../lib/errorHandler';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            // Check if bootstrap admin
            const isAdminAcc = firebaseUser.email === 'yesicalp@gmail.com' && firebaseUser.emailVerified;
            
            // Auto prompt or auto create profile.
            // Let's create a minimal staff profile
            const newProfile: Omit<UserProfile, 'id'> = {
              nombre: firebaseUser.displayName?.split(' ')[0] || 'Nuevo',
              apellido: firebaseUser.displayName?.split(' ').slice(1).join(' ') || 'Usuario',
              rol: isAdminAcc ? 'admin' : 'staff',
              estado_cuenta: isAdminAcc ? 'aprobado' : 'pendiente',
            };
            
            await setDoc(docRef, newProfile);
            setProfile({ id: firebaseUser.uid, ...newProfile } as UserProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
