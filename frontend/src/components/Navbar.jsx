import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Image, Camera, LogOut, User, PlusCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const Navbar = () => {
  const { user, updateProfile, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePicture, setProfilePicture] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [updating, setUpdating] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('bio', bio);
    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }
    if (selfie) {
      formData.append('selfie', selfie);
    }

    try {
      await updateProfile(formData);
      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
      setProfilePicture(null);
      setSelfie(null);
      setTimeout(() => setIsProfileOpen(false), 1500);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setUpdating(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-40 glass-panel bg-slate-950/80 border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
            <Camera className="text-white w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
            EventHub
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-medium">
          <Link 
            to="/dashboard" 
            className={`transition-colors text-sm tracking-wide ${isActive('/dashboard') ? 'text-cyan-500 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Events Directory
          </Link>
        </div>

        <div className="flex items-center gap-5">
          
          <Link 
            to="/notifications" 
            className={`relative p-2 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all ${isActive('/notifications') ? 'text-cyan-500 border-cyan-500/30' : ''}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-cyan-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-950 animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>

          <button 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-700">
              {user?.profilePicture ? (
                <img src={user.profilePicture.startsWith('/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profilePicture}` : user.profilePicture} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-cyan-500" />
              )}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-200 max-w-[80px] truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.hasSelfie ? 'Selfie Set' : 'No Selfie'}</div>
            </div>
          </button>

          <button 
            onClick={logout}
            className="p-2 rounded-xl border border-slate-800/80 hover:border-cyan-500/20 text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/5 transition-all"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)}>
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl relative shadow-2xl animate-fade-in border-slate-800" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <User className="text-cyan-500" /> My Profile Setup
            </h2>
            <p className="text-slate-400 text-xs mb-5">
              Set up your profile picture, bio, and face recognition reference image.
            </p>

            {statusMessage && (
              <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-medium mb-4 ${statusMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Bio</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself or your club association..."
                  className="w-full p-3 h-20 text-sm glass-input text-slate-100 resize-none"
                  maxLength={160}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Profile Picture</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                    {profilePicture ? (
                      <img src={URL.createObjectURL(profilePicture)} alt="" className="w-full h-full object-cover" />
                    ) : user?.profilePicture ? (
                      <img src={user.profilePicture.startsWith('/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profilePicture}` : user.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-slate-500 w-5 h-5" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setProfilePicture(e.target.files[0])}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-slate-200 file:hover:bg-slate-800 file:cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setStatusMessage(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg flex items-center gap-1 disabled:opacity-50"
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
