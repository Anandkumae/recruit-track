import { doc, updateDoc, getFirestore, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();


export const updateProfileImage = async (userId: string, imageUrl: string): Promise<boolean> => {
  try {
    const userRef = doc(firestore, 'users', userId);
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

export const getCurrentUserProfile = async (userId: string): Promise<User | null> => {
  if (!userId) return null;
  
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
  
  return null;
};
