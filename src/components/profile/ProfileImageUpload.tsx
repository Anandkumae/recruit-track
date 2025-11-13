'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useUser } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: Error) => void;
}

export function ProfileImageUpload({ 
  currentImageUrl, 
  onUploadSuccess, 
  onUploadError 
}: ProfileImageUploadProps) {
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPG, PNG, or WebP image.');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Firebase Storage
    try {
      setIsUploading(true);
      const storageRef = ref(storage, `profile-images/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      onUploadSuccess?.(downloadURL);
      toast.success('Profile image updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      onUploadError?.(error as Error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Optionally, you can add logic to remove the image from storage here
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage 
            src={previewUrl || '/default-avatar.png'} 
            alt="Profile"
            className="object-cover"
          />
          <AvatarFallback className="bg-muted text-2xl">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow-sm hover:bg-destructive/90"
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove image</span>
          </button>
        )}
      </div>

      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/webp"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={isUploading}
        />
        <Button 
          type="button" 
          variant="outline"
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {previewUrl ? 'Change' : 'Upload'} Photo
            </>
          )}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        JPG, PNG, or WebP. Max 2MB.
      </p>
    </div>
  );
}
