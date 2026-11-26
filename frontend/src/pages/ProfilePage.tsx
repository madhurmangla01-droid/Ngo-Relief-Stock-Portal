import React, { useRef, useState } from 'react';
import {
  Building2,
  Check,
  FileBadge2,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Upload,
  UserX,
} from 'lucide-react';
import { StatusBanner } from '../components/StatusBanner';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { PRESET_AVATARS } from '../types';

async function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file is not a valid image.'));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to process image in this browser.'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);

    if (!file.type.startsWith('image/')) {
      setError('Please select a PNG, JPG, or WebP image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }

    try {
      const resized = await resizeImageToDataUrl(file);
      setAvatarUrl(resized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process uploaded image.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!displayName.trim()) {
      setError('Display name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        role: user.role,
        avatarUrl,
      });
      setSuccess('Your display name and profile picture have been updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Profile &amp; Authorized NGO Details
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Personalize your display name and profile picture, and review your registered NGO
          credentials.
        </p>
      </div>

      {error && <StatusBanner variant="error" message={error} onDismiss={() => setError(null)} />}
      {success && (
        <StatusBanner variant="success" message={success} onDismiss={() => setSuccess(null)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Editable Profile Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 surface-card rounded-2xl p-5 sm:p-7 space-y-6"
          noValidate
        >
          {/* Live Preview Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-100">
            <UserAvatar
              name={displayName.trim() || user.displayName}
              avatarUrl={avatarUrl}
              size="xl"
            />
            <div className="space-y-2.5 flex-1 min-w-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 truncate">
                  {displayName.trim() || user.displayName}
                </h3>
                <p className="text-sm text-slate-500 truncate">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 min-h-[42px] rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Upload Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="inline-flex items-center gap-1.5 min-h-[42px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Use Initials</span>
                </button>
              </div>
            </div>
          </div>

          {/* Preset Portraits */}
          <div className="space-y-2.5">
            <p className="text-sm font-medium text-slate-700">Or select a coordinator portrait</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = avatarUrl === preset.url;
                return (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setAvatarUrl(preset.url)}
                    className={`flex items-center gap-3 min-h-[60px] rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {preset.label}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isSelected ? 'Selected' : 'Tap to choose'}
                      </p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Display Name & Account Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label
                htmlFor="profile-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Display Name <span className="text-red-600">*</span>
              </label>
              <input
                id="profile-name"
                type="text"
                required
                maxLength={120}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Official Email
              </label>
              <input
                id="profile-email"
                type="email"
                disabled
                value={user.email}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 min-h-[46px] rounded-xl bg-gradient-to-r from-[#0F2F55] to-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-900/15 hover:from-[#0A223D] hover:to-[#1E40AF] disabled:opacity-60 transition-all"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>

        {/* Registered NGO Credentials Summary */}
        <aside className="surface-card rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#0A223D] to-[#123861] px-5 py-4 text-white flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/18 border border-emerald-300/30 text-emerald-300 shrink-0">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Authorized NGO</h3>
              <p className="text-xs text-emerald-300/95 font-medium">Verified registration record</p>
            </div>
          </div>

          <dl className="p-5 space-y-3.5 text-sm">
            <div className="flex items-start gap-2.5">
              <Building2 className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">Organization Name</dt>
                <dd className="font-semibold text-slate-900 break-words">{user.ngo.name}</dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <FileBadge2 className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">Registration Number</dt>
                <dd className="font-mono font-semibold text-blue-700">
                  {user.ngo.registrationNumber}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">Operating Region</dt>
                <dd className="font-medium text-slate-800">{user.ngo.cityState}</dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">Official Phone</dt>
                <dd className="font-mono text-xs text-slate-800">{user.ngo.officialPhone}</dd>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <dt className="text-xs text-slate-500">Primary Relief Focus</dt>
              <dd className="font-medium text-slate-800 mt-0.5">{user.ngo.focusArea}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
