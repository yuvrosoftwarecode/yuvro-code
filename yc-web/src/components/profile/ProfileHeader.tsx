interface ProfileHeaderProps {
  title: string;
  subtitle: string;
  isEditing: boolean;
  onEditClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ title, subtitle, isEditing, onEditClick }) => (
  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
    <div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
    {!isEditing && (
      <button
        onClick={onEditClick}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
      >
        Edit Profile
      </button>
    )}
  </div>
);

export default ProfileHeader;
