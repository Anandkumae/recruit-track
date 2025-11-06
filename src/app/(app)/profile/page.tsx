'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, User as UserIcon, Mail, Phone, Book, Briefcase, Pencil, Save } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';

// In a real app, this would involve Firebase Storage
// For this demo, we'll just simulate the upload and store a placeholder URL.
async function uploadResume(firestore: any, userId: string, file: File) {
    // Simulate upload delay
    await new Promise(res => setTimeout(res, 1500));
    const resumeUrl = `resumes/${userId}/${file.name}`;
    
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, { resumeUrl });
    
    return resumeUrl;
}


export default function ProfilePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading } = useDoc(userProfileRef);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        qualification: '',
    });

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || '',
                phone: userProfile.phone || '',
                qualification: userProfile.qualification || '',
            });
        }
    }, [userProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!user || !firestore) return;
        setIsSaving(true);
        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, {
                name: formData.name,
                phone: formData.phone,
                qualification: formData.qualification,
            });
            toast({
                title: 'Profile Updated',
                description: 'Your changes have been saved successfully.',
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Save error:", error);
            toast({
                title: 'Update Failed',
                description: 'There was an error saving your changes.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };


    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user && firestore) {
            setIsUploading(true);
            try {
                await uploadResume(firestore, user.uid, file);
                toast({
                    title: 'Resume Uploaded',
                    description: `${file.name} has been saved to your profile.`,
                });
                // No refetch needed, useDoc provides real-time updates.
            } catch (error) {
                toast({
                    title: 'Upload Failed',
                    description: 'There was an error uploading your resume.',
                    variant: 'destructive',
                });
                console.error("Upload error:", error);
            } finally {
                setIsUploading(false);
            }
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
                        <AvatarImage src={user?.photoURL || undefined} alt={userProfile.name} />
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
                    {!isEditing && (
                         <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit Profile</span>
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} disabled={isSaving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={userProfile.email} disabled />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} disabled={isSaving}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="qualification">Highest Qualification</Label>
                                <Input id="qualification" name="qualification" value={formData.qualification} onChange={handleInputChange} disabled={isSaving} />
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
                    <CardTitle>Resume</CardTitle>
                    <CardDescription>Keep your resume up-to-date for quick applications.</CardDescription>
                </CardHeader>
                <CardContent>
                    {userProfile.resumeUrl ? (
                         <div className="space-y-3">
                             <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border">
                                <Briefcase className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground truncate">{userProfile.resumeUrl.split('/').pop()}</span>
                             </div>
                              <p className="text-xs text-muted-foreground">To update, upload a new file below.</p>
                         </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">You have not uploaded a resume yet.</p>
                    )}
                   
                    <div className="mt-4">
                        <Label htmlFor="resume-upload" className="block text-sm font-medium mb-2">Upload Resume</Label>
                        <div className="flex items-center gap-2">
                             <Input id="resume-upload" type="file" onChange={handleFileUpload} disabled={isUploading} className="flex-1" />
                            <Button onClick={() => document.getElementById('resume-upload')?.click()} disabled={isUploading} variant="outline">
                                {isUploading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="mr-2 h-4 w-4" />
                                )}
                                {isUploading ? 'Uploading...' : 'Choose File'}
                            </Button>
                        </div>
                         <p className="text-xs text-muted-foreground mt-2">Accepted formats: PDF, DOCX (Max 5MB).</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
