import ProfileField from './ProfileField';

interface ProfileViewProps {
  user: any;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user }) => (
  <dl>
    <ProfileField label="Username" value={user?.username} background="gray" />
    <ProfileField label="Email address" value={user?.email} background="white" />
    <ProfileField label="Bio" value={user?.profile?.bio || 'No bio provided'} background="gray" />
  </dl>
);

export default ProfileView;
