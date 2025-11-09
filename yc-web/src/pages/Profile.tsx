import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { MapPin, Edit, Globe, Mail } from 'lucide-react';
import EditProfileDialog, { ProfileData } from '../components/profile/EditProfileDialog';
import EditAboutDialog from '../components/profile/EditAboutDialog';
import Navigation from '../components/Navigation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const Profile = () => {
  const { user, token } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.username || '',
    email: user?.email || '',
    bio: '',
    location: '',
    website: '',
    avatar_url: undefined,  // Now properly optional
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);

  // Fetch live backend profile
  const fetchProfile = async () => {
    try {
      const authToken = token || localStorage.getItem('token');
      if (!authToken) return;
      const response = await fetch(`${API_URL}/auth/profile/detail/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      setProfileData({
        name: data.user.username,
        email: data.user.email,
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        avatar_url: data.avatar_url || undefined,
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  // Save profile to backend (partial update)
  const saveProfile = async (payload: Partial<ProfileData>) => {
    try {
      const authToken = token || localStorage.getItem('token');
      if (!authToken) {
        console.warn('No access token found');
        return;
      }

      const response = await fetch(`${API_URL}/auth/profile/detail/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('Profile save failed', response.status, err);
        return;
      }

      const data = await response.json();
      setProfileData({
        name: data.user?.username || profileData.name,
        email: data.user?.email || profileData.email,
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        avatar_url: data.avatar_url || undefined,
      });
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update backend profile
  const updateProfile = async (updatedFields: Partial<typeof profileData>) => {
    try {
      const authToken = token || localStorage.getItem('token');
      if (!authToken) return;
      const res = await fetch(`${API_URL}/auth/profile/detail/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      console.log('Updated profile:', updated);
      setProfileData({
        name: updated.user.username,
        email: updated.user.email,
        bio: updated.bio || '',
        location: updated.location || '',
        website: updated.website || '',
        avatar_url: updated.avatar_url || undefined,
      });
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background">
              {profileData.avatar_url ? (
                <AvatarImage src={profileData.avatar_url} />
              ) : (
                <AvatarFallback className="text-3xl bg-muted">
                  {profileData.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-bold">{profileData.name}</h1>
              <p className="text-muted-foreground">{profileData.email}</p>

              {profileData.location && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {profileData.location}
                </p>
              )}

              {profileData.website && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a
                    href={profileData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {profileData.website}
                  </a>
                </p>
              )}
            </div>

            <Button onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* About Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">About</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAboutDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {profileData.bio || 'No bio added yet.'}
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardContent className="p-6 space-y-2">
            <h2 className="text-xl font-semibold mb-2">Contact</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{profileData.email}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profileData={profileData}
        onSave={(updated) => {
          setProfileData(updated);
          updateProfile({
            bio: updated.bio,
            location: updated.location,
            website: updated.website,
          });
        }}
      />
      <EditAboutDialog
        open={aboutDialogOpen}
        onOpenChange={setAboutDialogOpen}
        about={profileData.bio}
        onSave={(bio) => {
          setProfileData({ ...profileData, bio });
          updateProfile({ bio });
        }}
      />
    </div>
  );
};

export default Profile;