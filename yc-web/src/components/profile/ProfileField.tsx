interface ProfileFieldProps {
  label: string;
  value: string | undefined;
  background?: 'white' | 'gray';
}

const ProfileField: React.FC<ProfileFieldProps> = ({ label, value, background = 'gray' }) => (
  <div className={`${background === 'gray' ? 'bg-gray-50' : 'bg-white'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{value || '—'}</dd>
  </div>
);

export default ProfileField;
