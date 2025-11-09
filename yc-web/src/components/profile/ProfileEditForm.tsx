interface ProfileEditFormProps {
  formData: { username: string; email: string; bio: string };
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  formData, isLoading, onChange, onCancel, onSubmit,
}) => (
  <form onSubmit={onSubmit} className="p-6 space-y-6">
    {['username', 'email'].map((field) => (
      <div key={field}>
        <label htmlFor={field} className="block text-sm font-medium text-gray-700">
          {field.charAt(0).toUpperCase() + field.slice(1)}
        </label>
        <input
          type={field === 'email' ? 'email' : 'text'}
          name={field}
          id={field}
          value={formData[field as keyof typeof formData]}
          onChange={onChange}
          disabled={isLoading}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
    ))}

    <div>
      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
      <textarea
        name="bio"
        id="bio"
        rows={3}
        value={formData.bio}
        onChange={onChange}
        disabled={isLoading}
        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder="Tell us about yourself..."
      />
    </div>

    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 border border-transparent rounded-md text-sm font-medium"
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </form>
);

export default ProfileEditForm;
