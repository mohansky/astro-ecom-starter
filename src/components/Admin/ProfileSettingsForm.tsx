import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../react-ui/Modal';
import { Button } from '../react-ui/Button';
import {
  useUser,
  useUpdateUser,
  useDeleteAccount,
  useUploadAvatar,
} from '../../hooks/useProfile';
import { QueryProvider } from '@/providers/QueryProvider';
import { TrashIcon } from '../Icons/TrashIcon';

interface ProfileSettingsFormProps {
  userId: string;
  r2BucketUrl?: string;
}

function ProfileSettingsFormContent({
  userId,
  r2BucketUrl,
}: ProfileSettingsFormProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  // Fetch current user data
  const { data: user, isLoading } = useUser(userId);
  const updateUserMutation = useUpdateUser();
  const deleteAccountMutation = useDeleteAccount();
  const uploadAvatarMutation = useUploadAvatar(userId);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const updateData: { name: string; username?: string; image?: string } = {
      name: formData.get('name') as string,
    };

    const username = formData.get('username') as string;
    const image = formData.get('image') as string;

    if (username?.trim()) updateData.username = username;
    if (image?.trim()) updateData.image = image;

    updateUserMutation.mutate({ id: userId, data: updateData });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please select JPEG, PNG, or WebP.');
      e.target.value = '';
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      toast.error(`File too large (${sizeMB}MB). Maximum size is 2MB.`);
      e.target.value = '';
      return;
    }

    // Auto-upload the file
    uploadAvatarMutation.mutate(file, {
      onSuccess: () => {
        setAvatarTimestamp(Date.now());
        e.target.value = '';
      },
      onError: () => {
        e.target.value = '';
      },
    });
  };

  const handleAvatarClick = () => {
    document.getElementById('avatar-file-input')?.click();
  };

  const handleDeleteAvatar = async () => {
    if (!user?.image) return;

    updateUserMutation.mutate(
      { id: userId, data: { image: '' } },
      {
        onSuccess: () => {
          setAvatarTimestamp(Date.now());
        },
      }
    );
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate(undefined, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="alert alert-error">
        <span>Failed to load user data</span>
      </div>
    );
  }

  // Get user initials for fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information Section */}
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body">
            <h2 className="card-title mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Profile Information
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email Address</span>
                  <span className="label-text-alt text-xs text-error">
                    (Email cannot be changed)
                  </span>
                </label>
                <input
                  type="email"
                  value={user.email}
                  className="input"
                  disabled
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Full Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={user.name}
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input
                  type="text"
                  name="username"
                  defaultValue={user.username || ''}
                  className="input input-bordered w-full"
                  placeholder="Enter a unique username"
                />
              </div>

              <div className="flex flex-row gap-4">
                <div>
                  <label className="label flex flex-col">
                    <span className="label-text">Role</span>
                  </label>
                  <div
                    className={`badge capitalize ${user.role === 'admin' ? 'badge-primary' : user.role === 'user' ? 'badge-info' : 'badge-error'}`}
                  >
                    {user.role}
                  </div>
                </div>

                <div>
                  <label className="label flex flex-col">
                    <span className="label-text">Is Email verified</span>
                  </label>
                  <div
                    className={`badge capitalize ${user.emailVerified ? 'badge-success' : 'badge-error'}`}
                  >
                    {user.emailVerified
                      ? 'Email Verified'
                      : 'Email not verified'}
                  </div>
                </div>
              </div>

              {/* Avatar Section */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Profile Avatar</span>
                </label>

                <div className="flex items-center gap-4">
                  {/* Clickable Avatar */}
                  <div className="relative group">
                    <div
                      onClick={handleAvatarClick}
                      className="avatar cursor-pointer transition-opacity hover:opacity-80"
                    >
                      <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        {user.image ? (
                          <img
                            key={`${user.image}-${avatarTimestamp}`}
                            src={`${user.image}?t=${avatarTimestamp}`}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold">
                            {getInitials(user.name)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upload Overlay */}
                    {uploadAvatarMutation.isPending && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <span className="loading loading-spinner loading-md text-white"></span>
                      </div>
                    )}

                    {/* Delete Button (only show if image exists) */}
                    {user.image && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAvatar();
                        }}
                        className="absolute -top-1 -right-1 btn btn-circle btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={updateUserMutation.isPending}
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">
                      Click avatar to upload
                    </p>
                    <p className="text-xs opacity-70">
                      Max 2MB. Supports JPEG, PNG, WebP
                    </p>
                    {user.image && (
                      <p className="text-xs opacity-50 mt-1">
                        Hover over avatar to delete
                      </p>
                    )}
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <input type="hidden" name="image" value={user.image || ''} />
              </div>

              <div className="card-actions justify-end">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Settings Section */}
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body">
            <h2 className="card-title mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Password & Security
            </h2>

            <div className="space-y-4">
              <div className="alert alert-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm">
                  <p className="font-medium mb-1">
                    Need to change your password?
                  </p>
                  <p>
                    For security reasons, please use the "Forgot Password" link
                    on the login page to reset your password.
                  </p>
                </div>
              </div>

              <div className="card-actions">
                <a
                  href="/forgot-password"
                  className="btn btn-outline btn-primary"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  Reset Password
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card bg-base-200 shadow-sm mt-8 border-l-4 border-l-error">
        <div className="card-body">
          <h2 className="card-title text-error mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            Danger Zone
          </h2>

          <div className="alert alert-warning mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>Account deletion is permanent and cannot be undone.</span>
          </div>

          <div className="card-actions justify-end">
            <button
              className="btn btn-error"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account"
        size="sm"
      >
        <div className="py-4">
          <p className="mb-4 text-error font-semibold">
            Are you absolutely sure you want to delete your account?
          </p>
          <p className="mb-4 text-sm opacity-70">
            This action cannot be undone and will permanently delete:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-1 text-sm opacity-70">
            <li>Your profile information</li>
            <li>All your data and preferences</li>
            <li>Access to your admin account</li>
          </ul>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteAccountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="error"
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending
                ? 'Deleting...'
                : 'Delete Forever'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function ProfileSettingsForm({
  userId,
  r2BucketUrl,
}: ProfileSettingsFormProps) {
  return (
    <QueryProvider>
      <ProfileSettingsFormContent userId={userId} r2BucketUrl={r2BucketUrl} />
    </QueryProvider>
  );
}
