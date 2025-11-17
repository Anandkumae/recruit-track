'use client';

import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes, type Storage } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, User as UserIcon, Mail, Phone, Book, Pencil, Save, Eye, FileText, Wand2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProfileImageUpload } from '@/components/profile/ProfileImageUpload';
import { updateProfileImage } from '@/lib/services/profileService';
import { parseResumeAction } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

function ResumeSection({ resumeUrl, storage }: { resumeUrl?: string, storage: Storage | null }) {
    const [downloadURL, setDownloadURL] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (resumeUrl && storage) {
            setIsLoading(true);
            const fileRef = ref(storage, resumeUrl);
            getDownloadURL(fileRef)
                .then((url) => setDownloadURL(url))
                .catch((error) => {
                    console.error("Error getting download URL:", error);
                    setDownloadURL(null); // Ensure no stale URL is shown
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
            setDownloadURL(null);
        }
    }, [resumeUrl, storage]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading resume...</span>
            </div>
        );
    }
    
    if (downloadURL) {
        return (
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Your uploaded resume</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href={downloadURL} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-2 h-4 w-4" /> View
                    </Link>
                </Button>
            </div>
        );
    }

    return <p className="text-sm text-muted-foreground">You have not uploaded a resume yet.</p>;
}


export default function ProfilePage() {
    const { user } = useUser();
    const { firestore, storage } = useFirebase();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading } = useDoc(userProfileRef);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        qualification: '',
        avatarUrl: '',
        skills: [] as string[],
    });

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || '',
                phone: userProfile.phone || '',
                qualification: userProfile.qualification || '',
                avatarUrl: userProfile.avatarUrl || '',
                skills: userProfile.skills || [],
            });
        }
    }, [userProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!userProfileRef) return;
        
        try {
            setIsSaving(true);
            await updateDoc(userProfileRef, {
                ...formData,
                updatedAt: serverTimestamp()
            });
            
            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
            });
            
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUploadSuccess = async (imageUrl: string) => {
        if (!user?.uid) return;
        
        try {
            await updateProfileImage(user.uid, imageUrl);
            setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));
        } catch (error) {
            console.error('Error updating profile image:', error);
            toast({
                title: "Error",
                description: "Failed to update profile image. Please try again.",
                variant: "destructive",
            });
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUploadAndParse = async () => {
        if (!selectedFile || !user || !storage || !firestore) {
            toast({ title: 'Upload Failed', description: 'Please select a file first.', variant: 'destructive' });
            return;
        }

        setIsUploading(true);
        const storageRef = ref(storage, `resumes/${user.uid}/${Date.now()}-${selectedFile.name}`);

        try {
            // 1. Upload the file
            await uploadBytes(storageRef, selectedFile);
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, {
                resumeUrl: storageRef.fullPath,
            });

            toast({ title: 'Upload Successful', description: 'Your resume has been uploaded.' });

            // 2. Parse the file
            const parseFormData = new FormData();
            parseFormData.append('resumeFile', selectedFile);
            
            const result = await parseResumeAction({}, parseFormData);

            if (result.success && result.parsedData) {
                const { name, phone, qualification, skills } = result.parsedData;
                setFormData(prev => ({
                    ...prev,
                    ...(name && { name }),
                    ...(phone && { phone }),
                    ...(qualification && { qualification }),
                    ...(skills && { skills }),
                }));
                
                await updateDoc(userDocRef, {
                    skills, // also save skills to Firestore
                });
                
                toast({
                    title: 'Resume Parsed!',
                    description: 'Your profile details have been auto-filled. Please review and save.',
                });
                setIsEditing(true); // Switch to edit mode to show the new data
            } else {
                const errorMsg = result.errors?._form?.[0] || 'Could not parse resume.';
                toast({ title: 'Parsing Failed', description: errorMsg, variant: 'destructive' });
            }

            setSelectedFile(null);
        } catch (error: any) {
             console.error("Upload/Parse error:", error);
            toast({
                title: 'Operation Failed',
                description: error.message || 'There was an error during the upload and parsing process.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const getInitials = (name: string) => {
        return name ? name.split(' ').map(n => n[0]).join('') : '';
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!userProfile) {
        return <p>Could not load user profile.</p>
    }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View and manage your personal information.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
             <Card>
                <CardContent className="pt-6 flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={formData.avatarUrl || user?.photoURL || undefined} alt={userProfile.name} />
                        <AvatarFallback className="text-3xl">{getInitials(userProfile.name)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-semibold">{userProfile.name}</h2>
                    <p className="text-muted-foreground">{userProfile.role}</p>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Your contact and qualification details.</CardDescription>
                    </div>
                     <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                        <span className="sr-only">{isEditing ? 'Save' : 'Edit'} Profile</span>
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isEditing ? (
                        <>
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <ProfileImageUpload 
                                            currentImageUrl={formData.avatarUrl}
                                            onUploadSuccess={handleImageUploadSuccess}
                                        />
                                    </div>
                                    
                                    <div className="flex-1 pl-4">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name</Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    name="name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    value={user?.email || ''}
                                                    disabled
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} disabled={isSaving}/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="qualification">Highest Qualification</Label>
                                                <Input id="qualification" name="qualification" value={formData.qualification} onChange={handleInputChange} disabled={isSaving} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <UserIcon className="h-5 w-5 text-muted-foreground" />
                                <span>{userProfile.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <span>{userProfile.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground" />
                                <span>{userProfile.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Book className="h-5 w-5 text-muted-foreground" />
                                <span>{userProfile.qualification || 'Not provided'}</span>
                            </div>
                        </>
                    )}
                </CardContent>
                {isEditing && (
                    <CardFooter className="justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                )}
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>My Resume</CardTitle>
                    <CardDescription>Upload a resume to auto-fill your profile information.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                     <ResumeSection resumeUrl={userProfile.resumeUrl} storage={storage} />

                    <div className="space-y-2">
                        <Label htmlFor="resume-upload">Upload New Resume</Label>
                        <div className="flex gap-2">
                            <Input id="resume-upload" type="file" onChange={handleFileChange} className="flex-grow" accept=".pdf,.doc,.docx,.txt,.png,.jpg" />
                            <Button onClick={handleUploadAndParse} disabled={!selectedFile || isUploading}>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                Upload & Parse
                            </Button>
                        </div>
                         {selectedFile && <p className="text-xs text-muted-foreground">Selected: {selectedFile.name}</p>}
                         <Alert className="mt-4 border-blue-500/50 bg-blue-500/5 text-blue-800 dark:text-blue-300">
                           <AlertDescription>
                                Uploading a new resume will automatically extract your name, phone, qualifications, and skills to populate your profile.
                           </AlertDescription>
                         </Alert>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>My Skills</CardTitle>
                    <CardDescription>Skills extracted from your resume.</CardDescription>
                </CardHeader>
                <CardContent>
                    {formData.skills && formData.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {formData.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary">{skill}</Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No skills found. Upload a resume to populate this section.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
