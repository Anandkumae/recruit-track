import { doc, updateDoc, getFirestore, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '@/lib/firebase';
import type { User } from '@/lib/types';

const db = getFirestore(app);
const auth = getAuth(app);

export const updateProfileImage = async (userId: string, imageUrl: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      avatarUrl: imageUrl,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating profile image:', error);
    throw error;
  }
};

export const getCurrentUserProfile = async (): Promise<User | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
  
  return null;
};
