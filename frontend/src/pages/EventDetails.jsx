import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Navbar from '../components/Navbar';
import { 
  Calendar, Tag, Shield, Lock, Unlock, Eye, EyeOff, Upload, 
  Trash2, UserMinus, Check, X, Users, MessageSquare, Heart, 
  Download, ArrowLeft, Search, Plus, Sparkles, FileVideo, FileImage,
  Clock, ChevronRight
} from 'lucide-react';

const EventDetails = () => {
  const { eventId } = useParams();
  const { token, user } = useAuth();
  const { socket } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [event, setEvent] = useState(null);
  const [media, setMedia] = useState([]);
  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search/Filters inside the event
  const [mediaSearch, setMediaSearch] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState('ALL'); // 'ALL' | 'PUBLIC' | 'PRIVATE'

  // Modal views
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  // File Upload states
  const [uploadFiles, setUploadFiles] = useState([]);
  const [isUploadPublic, setIsUploadPublic] = useState(true);
  const [taggedUsers, setTaggedUsers] = useState([]); // List of user IDs tagged in this upload
  const [uploading, setUploading] = useState(false);

  // Lightbox detail
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Edit Event state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // User Profile Modal state
  const [profileUserId, setProfileUserId] = useState(null);
  const [profileUserData, setProfileUserData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isMembersListOpen, setIsMembersListOpen] = useState(false);

  // Ref to track currently selected photo to avoid stale closures in socket listener
  const selectedPhotoRef = useRef(selectedPhoto);
  useEffect(() => {
    selectedPhotoRef.current = selectedPhoto;
  }, [selectedPhoto]);

  const fetchEventDetails = async () => {
    try {
      // Fetch Event Metadata
      const eventRes = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!eventRes.ok) {
        const errData = await eventRes.json();
        throw new Error(errData.message || 'Access Denied: Private Event');
      }
      const eventData = await eventRes.json();
      setEvent(eventData);
      setEditName(eventData.name || '');
      setEditDescription(eventData.description || '');
      setEditCategory(eventData.category || '');

      // Fetch Event Media
      const mediaRes = await fetch(`http://localhost:5000/api/media/event/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        setMedia(mediaData);
      }

      // Fetch Members list
      const membersRes = await fetch(`http://localhost:5000/api/events/${eventId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }

      // If user is Admin, fetch pending join requests
      if (eventData.role === 'ADMIN') {
        const requestsRes = await fetch(`http://localhost:5000/api/events/${eventId}/join-requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          setJoinRequests(requestsData);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId, token]);

  // Real-time synchronization using Socket.io
  useEffect(() => {
    if (!socket || !eventId) return;

    // Join room
    socket.emit('join_event', eventId);

    // Register room event hooks
    socket.on('media_updated', (data) => {
      console.log('Realtime: media list updated', data);
      fetchEventDetails();
      if (data && data.action === 'delete' && selectedPhotoRef.current && selectedPhotoRef.current._id === data.mediaId) {
        handleCloseLightbox();
        alert('This photo has been deleted by an administrator or the uploader.');
      }
    });

    socket.on('requests_updated', () => {
      console.log('Realtime: join requests updated');
      fetchEventDetails();
    });

    socket.on('membership_updated', (data) => {
      console.log('Realtime: membership status updated', data);
      fetchEventDetails();
    });

    socket.on('event_updated', (data) => {
      console.log('Realtime: event details updated', data);
      if (data && data.action === 'delete') {
        alert('This event has been deleted by an administrator.');
        navigate('/');
      } else {
        fetchEventDetails();
      }
    });

    return () => {
      // Leave room and cleanup handlers
      socket.emit('leave_event', eventId);
      socket.off('media_updated');
      socket.off('requests_updated');
      socket.off('membership_updated');
      socket.off('event_updated');
    };
  }, [socket, eventId]);

  // Open specific photo if mediaId query param is present
  useEffect(() => {
    if (media.length === 0) return;
    const mediaIdParam = searchParams.get('mediaId');
    if (mediaIdParam) {
      const photo = media.find(m => m._id === mediaIdParam);
      if (photo) {
        setSelectedPhoto(photo);
      }
    }
  }, [media, searchParams]);

  // Load comments & likes for selected photo
  useEffect(() => {
    if (!selectedPhoto) return;
    const fetchSocials = async () => {
      try {
        const likeRes = await fetch(`http://localhost:5000/api/interactions/like/${selectedPhoto._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (likeRes.ok) {
          const data = await likeRes.json();
          setLiked(data.liked);
          setLikeCount(data.likeCount);
        }

        const commentRes = await fetch(`http://localhost:5000/api/interactions/comments/${selectedPhoto._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (commentRes.ok) {
          const data = await commentRes.json();
          setComments(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSocials();
  }, [selectedPhoto]);

  // Social updates
  const handleLike = async () => {
    if (!selectedPhoto) return;
    try {
      const res = await fetch('http://localhost:5000/api/interactions/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mediaId: selectedPhoto._id })
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPhoto) return;

    try {
      const res = await fetch('http://localhost:5000/api/interactions/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mediaId: selectedPhoto._id, content: newComment })
      });
      if (res.ok) {
        const comment = await res.json();
        setComments(prev => [...prev, comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (photo) => {
    fetch(`http://localhost:5000/api/media/${photo._id}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `protected_${photo.filename}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => console.error(err));
  };

  // Join Requests
  const handleRequestApproval = async (requestId, approve) => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/join-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: approve ? 'APPROVED' : 'DENIED' })
      });

      if (res.ok) {
        // Remove from pending UI list
        setJoinRequests(prev => prev.filter(r => r._id !== requestId));
        // Refresh members list
        if (approve) {
          fetchEventDetails();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Event Member
  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user from the event?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.userId._id !== userId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Leave Event
  const handleLeaveEvent = async () => {
    if (!window.confirm('Are you sure you want to leave this event?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/leave`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinRequest = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/join-request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchEventDetails();
      } else {
        const data = await res.json();
        alert(data.message || 'Request failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lightbox navigation helpers
  const handleSelectPhoto = (photo) => {
    setSelectedPhoto(photo);
    setSearchParams({ mediaId: photo._id });
  };

  const handleCloseLightbox = () => {
    setSelectedPhoto(null);
    setSearchParams({});
  };

  // Delete Media
  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm('Are you sure you want to delete this media? This will permanently delete the photo, all its comments, likes, and files.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/media/${mediaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        handleCloseLightbox();
        fetchEventDetails();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to delete media');
      }
    } catch (err) {
      console.error('Error deleting media:', err);
    }
  };

  // Update Event Settings
  const handleUpdateEventSettings = async (updatedFields) => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        fetchEventDetails();
      } else {
        alert('Failed to update event settings');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm("ARE YOU ABSOLUTELY SURE you want to delete this event? This action is permanent and will delete all photos, members, comments, and AWS Rekognition face metadata.")) {
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setIsAdminPanelOpen(false);
        alert('Event deleted successfully.');
        navigate('/');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete event.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete event: Server error.');
    }
  };

  // Fetch Public Profile details on request
  useEffect(() => {
    if (!profileUserId) {
      setProfileUserData(null);
      return;
    }

    const fetchUserProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/auth/users/${profileUserId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfileUserData(data);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [profileUserId, token]);

  // File Upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFileFromQueue = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('eventId', eventId);
    formData.append('isPublic', isUploadPublic);
    formData.append('taggedUsers', JSON.stringify(taggedUsers));

    uploadFiles.forEach(file => {
      formData.append('mediaFiles', file);
    });

    try {
      const res = await fetch('http://localhost:5000/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        // Reset upload queue
        setUploadFiles([]);
        setTaggedUsers([]);
        setIsUploadOpen(false);
        // Refresh event data to show uploaded media
        fetchEventDetails();
      } else {
        const data = await res.json();
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed: Server connection issue');
    } finally {
      setUploading(false);
    }
  };

  const toggleTagUser = (userId) => {
    if (taggedUsers.includes(userId)) {
      setTaggedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setTaggedUsers(prev => [...prev, userId]);
    }
  };

  // Filter Media
  const filteredMedia = media.filter(m => {
    const matchesSearch = m.filename.toLowerCase().includes(mediaSearch.toLowerCase()) ||
                          m.tags.some(tag => tag.toLowerCase().includes(mediaSearch.toLowerCase())) ||
                          m.uploaderId?.name.toLowerCase().includes(mediaSearch.toLowerCase());
    
    if (privacyFilter === 'PUBLIC') return matchesSearch && m.isPublic;
    if (privacyFilter === 'PRIVATE') return matchesSearch && !m.isPublic;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 pb-20">
        <Navbar />
        <div className="max-w-md mx-auto mt-20 p-8 glass-panel text-center rounded-3xl border-rose-500/20 shadow-xl">
          <Lock className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-slate-200 font-bold">Access Restricted</h3>
          <p className="text-slate-400 text-xs mt-2">{error}</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-6 px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* Navigation back link */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>

        {/* Hero Event Banner Detail Header */}
        <div className="glass-panel p-6 rounded-3xl border-slate-900 mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Tag className="w-3 h-3 text-rose-500" />
                {event.category}
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-100">{event.name}</h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">{event.description || 'No description provided.'}</p>
            
            <div className="flex items-center gap-6 mt-5 text-xs text-slate-500 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-600" />
                <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-slate-600" />
                <span>Organized by <span className="text-slate-400 font-semibold cursor-pointer hover:underline hover:text-rose-400 transition-colors" onClick={() => setProfileUserId(event.createdById?._id)}>{event.createdById?.name || 'Club'}</span></span>
              </div>
              <button 
                onClick={() => setIsMembersListOpen(true)}
                className="flex items-center gap-1.5 hover:text-slate-350 cursor-pointer transition-colors"
              >
                <Users className="w-4 h-4 text-slate-600" />
                <span>{members.length} Members</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {event.role === 'ADMIN' && (
              <button 
                onClick={() => setIsAdminPanelOpen(true)}
                className="px-5 py-3 text-xs font-bold text-slate-200 border border-slate-800 bg-slate-900/60 rounded-xl hover:border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Users className="w-4 h-4 text-rose-500" />
                Admin Dashboard
                {joinRequests.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            )}

            {event.isMember && (
              <button 
                onClick={() => setIsUploadOpen(true)}
                className="px-5 py-3 text-xs font-bold bg-rose-600 text-white rounded-xl shadow-lg hover:bg-rose-500 flex items-center justify-center gap-1.5 transition-all"
              >
                <Upload className="w-4 h-4" />
                Upload Media
              </button>
            )}

            {event.isMember && event.role !== 'ADMIN' && (
              <button 
                onClick={handleLeaveEvent}
                className="px-4 py-3 text-xs font-semibold text-slate-400 border border-slate-900 rounded-xl hover:text-rose-400 hover:bg-rose-500/5 hover:border-rose-500/20"
              >
                Leave Event
              </button>
            )}
          </div>
        </div>

        {!event.isMember && (
          <div className="glass-panel p-6 rounded-2xl border-amber-500/20 bg-amber-500/5 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">Want to view private photos?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  This event is public, but private media is only visible to event members. Request membership to unlock all photos and videos.
                </p>
              </div>
            </div>
            {event.requestStatus === 'PENDING' ? (
              <span className="px-5 py-2.5 rounded-xl bg-slate-900 text-slate-400 text-xs font-bold border border-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500 animate-pulse" /> Pending Approval
              </span>
            ) : (
              <button
                onClick={handleJoinRequest}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold transition-all shadow-lg shadow-amber-600/10 flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" /> Request Membership
              </button>
            )}
          </div>
        )}

        {/* Media Grid Section Toolbar */}
        <div className="glass-panel p-4 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-900">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search files by tag, uploader or name..."
              value={mediaSearch}
              onChange={(e) => setMediaSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs glass-input text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Privacy Filter:</span>
            {['ALL', 'PUBLIC', 'PRIVATE'].map(filter => (
              <button
                key={filter}
                onClick={() => setPrivacyFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${privacyFilter === filter ? 'border-rose-500/30 text-rose-400 bg-rose-500/5' : 'border-slate-800 hover:border-slate-700 text-slate-400'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid Display */}
        {filteredMedia.length === 0 ? (
          <div className="glass-panel text-center py-24 rounded-3xl border-slate-900">
            <FileImage className="w-12 h-12 text-slate-800 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-400">No media found</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto leading-normal">
              No photos or videos match your query, or uploader has not added media files here yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredMedia.map((photo) => (
              <div 
                key={photo._id} 
                className="group relative rounded-xl overflow-hidden glass-panel aspect-square border-slate-900 cursor-pointer shadow-md"
                onClick={() => handleSelectPhoto(photo)}
              >
                {photo.type === 'VIDEO' ? (
                  <div className="w-full h-full relative overflow-hidden bg-slate-900">
                    <video 
                      src={photo.url.startsWith('/') ? `http://localhost:5000${photo.url}` : photo.url} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      preload="metadata"
                    />
                    
                    {/* Video Play Overlay Badge */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-slate-950/80 backdrop-blur-sm border border-slate-800 flex items-center justify-center text-rose-500 shadow-lg shadow-black/40">
                        <FileVideo className="w-5 h-5 fill-rose-500/20" />
                      </div>
                    </div>

                    {/* Public/Private Badge overlay */}
                    <div className="absolute top-2 right-2 p-1 rounded-md bg-slate-950/80 border border-slate-850 z-10">
                      {photo.isPublic ? <Unlock className="w-3 h-3 text-slate-300" /> : <Lock className="w-3 h-3 text-amber-500" />}
                    </div>

                    {/* Bottom overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 z-10">
                      <div className="text-[10px] font-bold text-slate-100 truncate">{photo.filename || 'media_file'}</div>
                      {photo.tags && photo.tags.length > 0 && (
                        <div className="text-[9px] text-rose-400 truncate mt-1">#{photo.tags.slice(0, 2).join(' #')}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <img 
                      src={photo.url.startsWith('/') ? `http://localhost:5000${photo.url}` : photo.url} 
                      alt={photo.filename} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Public/Private Badge overlay */}
                    <div className="absolute top-2 right-2 p-1 rounded-md bg-slate-950/80 border border-slate-850 z-10">
                      {photo.isPublic ? <Unlock className="w-3 h-3 text-slate-300" /> : <Lock className="w-3 h-3 text-amber-500" />}
                    </div>

                    {/* Bottom overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 z-10">
                      <div className="text-[10px] font-bold text-slate-100 truncate">{photo.filename || 'media_file'}</div>
                      {photo.tags && photo.tags.length > 0 && (
                        <div className="text-[9px] text-rose-400 truncate mt-1">#{photo.tags.slice(0, 2).join(' #')}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Upload Media Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsUploadOpen(false)}>
          <div className="w-full max-w-xl glass-panel p-6 rounded-2xl relative shadow-2xl animate-fade-in border-slate-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-1">Upload Media Files</h2>
            <p className="text-slate-400 text-xs mb-5">Upload event photography and footage. AI automatically generates descriptive tags.</p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              
              {/* Drag and Drop Zone */}
              <div className="p-8 border border-dashed border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/5 rounded-2xl text-center cursor-pointer transition-all relative">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-300 block">Drag & drop files or click to browse</span>
                <span className="text-[10px] text-slate-500 block mt-1">Supports JPG, PNG, WEBP, MP4 up to 30MB</span>
              </div>

              {/* Upload Files list */}
              {uploadFiles.length > 0 && (
                <div className="space-y-2 max-h-[200px] overflow-y-auto p-1.5 bg-slate-950/50 border border-slate-900 rounded-xl">
                  {uploadFiles.map((file, idx) => {
                    const isVideo = file.type.startsWith('video');
                    const objectUrl = URL.createObjectURL(file);
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-slate-800/80 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Mini thumbnail preview */}
                          <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                            {isVideo ? (
                              <video 
                                src={objectUrl} 
                                className="w-full h-full object-cover"
                                preload="metadata"
                              />
                            ) : (
                              <img 
                                src={objectUrl} 
                                alt="" 
                                className="w-full h-full object-cover" 
                              />
                            )}
                          </div>
                          
                          <div className="min-w-0">
                            <div className="truncate max-w-[180px] text-slate-300 font-semibold truncate">{file.name}</div>
                            <div className="text-[10px] text-slate-505">({Math.round(file.size / 1024 / 1024 * 100) / 100} MB)</div>
                          </div>
                        </div>
                        
                        <button 
                          type="button" 
                          onClick={() => {
                            URL.revokeObjectURL(objectUrl);
                            handleRemoveFileFromQueue(idx);
                          }}
                          className="text-slate-500 hover:text-rose-500 p-0.5 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Privacy Setting */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Upload Privacy</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUploadPublic(true)}
                    className={`py-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${isUploadPublic ? 'border-rose-500/40 text-rose-400 bg-rose-500/5' : 'border-slate-800 bg-slate-950/20 text-slate-500'}`}
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Public Media</span>
                    <span className="text-[8px] font-normal text-slate-500">Visible to anyone who views this event</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUploadPublic(false)}
                    className={`py-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${!isUploadPublic ? 'border-rose-500/40 text-rose-400 bg-rose-500/5' : 'border-slate-800 bg-slate-950/20 text-slate-500'}`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Private Media</span>
                    <span className="text-[8px] font-normal text-slate-500">Only visible to Event Members</span>
                  </button>
                </div>
              </div>

              {/* Tag Friends/Users Manual Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Tag Event Members (Manual)</span>
                  <span className="text-[10px] text-slate-500">Click member to tag</span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-2 border border-slate-900 bg-slate-950/30 rounded-xl">
                  {members.map(member => {
                    const isTagged = taggedUsers.includes(member.userId._id);
                    return (
                      <button
                        key={member.userId._id}
                        type="button"
                        onClick={() => toggleTagUser(member.userId._id)}
                        className={`px-3 py-1 rounded-lg text-xs border font-medium transition-all ${isTagged ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 font-bold' : 'border-slate-850 hover:border-slate-700 text-slate-400'}`}
                      >
                        {member.userId.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-900">
                <button 
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                  disabled={uploading || uploadFiles.length === 0}
                >
                  {uploading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" /> AI Analyzing Uploads...
                    </>
                  ) : 'Start Upload'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Admin Panel Modal (Members & Request Approvals) */}
      {isAdminPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAdminPanelOpen(false)}>
          <div className="w-full max-w-2xl glass-panel p-6 rounded-2xl relative shadow-2xl animate-fade-in border-slate-800 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsAdminPanelOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg p-1"
            >
              ×
            </button>
            <h2 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Shield className="text-rose-500" /> Admin Control Board
            </h2>
            <p className="text-slate-400 text-xs mb-6">Manage event settings, pending join requests and event membership.</p>

            {/* Event Settings Panel */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              await handleUpdateEventSettings({ name: editName, description: editDescription, category: editCategory });
              alert('Event settings updated successfully!');
            }} className="mb-6 p-4 border border-slate-800 bg-slate-900/40 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Settings</h3>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Event Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category Tag</label>
                <select 
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 text-slate-350 focus:outline-none focus:border-rose-500"
                >
                  {['Photoshoot', 'Workshop', 'Trip', 'Competition', 'Cultural Fest', 'Party'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Event Bio / Description</label>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="3"
                  className="w-full py-2.5 px-3.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-rose-500"
                  placeholder="Enter event bio..."
                />
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  Save Settings
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Pending Join Requests */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Pending Requests ({joinRequests.length})</span>
                </h3>

                {joinRequests.length === 0 ? (
                  <div className="p-4 border border-slate-900 bg-slate-950/30 rounded-xl text-center text-xs text-slate-600 font-medium">
                    No pending requests.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {joinRequests.map(req => (
                      <div key={req._id} className="p-3 border border-slate-900 bg-slate-900/40 rounded-xl flex items-center justify-between text-xs gap-3">
                        <div 
                          className="min-w-0 cursor-pointer group/req"
                          onClick={() => setProfileUserId(req.userId._id)}
                        >
                          <div className="font-bold text-slate-200 truncate group-hover/req:text-rose-400 transition-colors">{req.userId.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{req.userId.email}</div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button 
                            onClick={() => handleRequestApproval(req._id, true)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRequestApproval(req._id, false)}
                            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                            title="Decline"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Manage Members */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Approved Members ({members.length})
                </h3>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {members.map(member => {
                    const isCreator = event.createdById.toString() === member.userId._id;
                    return (
                      <div key={member._id} className="p-3 border border-slate-900 bg-slate-900/20 rounded-xl flex items-center justify-between text-xs gap-3">
                        <div 
                          className="min-w-0 flex items-center gap-2 cursor-pointer group/member"
                          onClick={() => setProfileUserId(member.userId._id)}
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-[10px] text-slate-400 font-bold border border-slate-700 flex-shrink-0 group-hover/member:border-rose-500 transition-colors">
                            {member.userId.profilePicture ? (
                              <img src={member.userId.profilePicture.startsWith('/') ? `http://localhost:5000${member.userId.profilePicture}` : member.userId.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : member.userId.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-200 truncate group-hover/member:text-rose-400 transition-colors">{member.userId.name}</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider">{member.role}</div>
                          </div>
                        </div>

                        {!isCreator && (
                          <button
                            onClick={() => handleRemoveMember(member.userId._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/5"
                            title="Remove Member"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-rose-950/45 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-rose-950/5 p-4 rounded-xl border border-rose-900/10">
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-rose-450 uppercase tracking-wider">Danger Zone</h4>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Permanently delete this event and all associated content. This cleans up members, requests, comments, likes, storage files, and AWS Rekognition face metadata. This cannot be undone.</p>
          </div>
          <button
            type="button"
            onClick={handleDeleteEvent}
            className="px-4 py-2.5 bg-rose-950/30 hover:bg-rose-600 border border-rose-900/40 hover:border-rose-500 text-rose-450 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" /> Delete Event
          </button>
        </div>

      </div>
    </div>
      )}

      {/* Media Viewer Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md" onClick={() => handleCloseLightbox()}>
          <div className="w-full max-w-4xl glass-panel rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border-slate-900 h-[80vh] max-h-[650px]" onClick={(e) => e.stopPropagation()}>
            
            {/* Image side */}
            <div className="flex-1 bg-black flex items-center justify-center relative p-2 h-1/2 md:h-full">
              {selectedPhoto.type === 'VIDEO' ? (
                <video 
                  src={selectedPhoto.url.startsWith('/') ? `http://localhost:5000${selectedPhoto.url}` : selectedPhoto.url} 
                  controls 
                  className="w-full h-full object-contain"
                />
              ) : (
                <img 
                  src={selectedPhoto.url.startsWith('/') ? `http://localhost:5000${selectedPhoto.url}` : selectedPhoto.url} 
                  alt="" 
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Social drawer details side */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-900 p-6 flex flex-col justify-between h-1/2 md:h-full bg-slate-950/40 backdrop-blur-sm">
              <div className="overflow-y-auto pr-1 flex-1 flex flex-col">
                
                {/* Meta header */}
                <div className="border-b border-slate-900 pb-4 mb-4 relative">
                  <button 
                    onClick={() => handleCloseLightbox()} 
                    className="absolute -top-3 -right-3 text-slate-400 hover:text-slate-200 text-lg p-1"
                  >
                    ×
                  </button>
                  <h3 className="font-extrabold text-sm text-slate-100 leading-snug">{selectedPhoto.filename}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div 
                      className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-[10px] text-slate-400 font-bold border border-slate-700 cursor-pointer hover:border-rose-500 transition-colors flex-shrink-0"
                      onClick={() => setProfileUserId(selectedPhoto.uploaderId?._id)}
                    >
                      {selectedPhoto.uploaderId?.profilePicture ? (
                        <img 
                          src={selectedPhoto.uploaderId.profilePicture.startsWith('/') ? `http://localhost:5000${selectedPhoto.uploaderId.profilePicture}` : selectedPhoto.uploaderId.profilePicture} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        selectedPhoto.uploaderId?.name?.charAt(0)
                      )}
                    </div>
                    <div 
                      className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider cursor-pointer transition-colors"
                      onClick={() => setProfileUserId(selectedPhoto.uploaderId?._id)}
                    >
                      uploaded by <span className="text-slate-400 font-bold hover:underline">@{selectedPhoto.uploaderId?.name}</span>
                    </div>
                  </div>

                  {/* Manual tags list */}
                  {selectedPhoto.taggedUsers && selectedPhoto.taggedUsers.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tagged Users:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedPhoto.taggedUsers.map(u => (
                          <span key={u._id} className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            @{u.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI classification tags */}
                  {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {selectedPhoto.tags.map(tag => (
                        <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/5 text-rose-400/80 border border-rose-500/10 font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comments List */}
                <div className="flex-1 space-y-3 mb-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    Comments ({comments.length})
                  </h4>

                  {comments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-600 font-medium">
                      No comments yet. Write one below!
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                      {comments.map(c => (
                        <div key={c._id} className="flex gap-2.5 text-xs bg-slate-900/40 p-2.5 rounded-xl border border-slate-900/50 items-start">
                          {/* Profile Picture */}
                          <div 
                            className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-[10px] text-slate-400 font-bold border border-slate-700 cursor-pointer hover:border-rose-500 transition-colors flex-shrink-0"
                            onClick={() => setProfileUserId(c.userId?._id)}
                          >
                            {c.userId?.profilePicture ? (
                              <img 
                                src={c.userId.profilePicture.startsWith('/') ? `http://localhost:5000${c.userId.profilePicture}` : c.userId.profilePicture} 
                                alt="" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              c.userId?.name?.charAt(0)
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span 
                                className="font-bold text-slate-300 cursor-pointer hover:text-rose-450 hover:underline transition-colors"
                                onClick={() => setProfileUserId(c.userId?._id)}
                              >
                                {c.userId?.name}
                              </span>
                              <span className="text-[8px] text-slate-500">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-400 leading-normal">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Inputs, likes & download */}
              <div className="border-t border-slate-900 pt-4 mt-auto space-y-4">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleLike}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${liked ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'border-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
                      <span>{likeCount}</span>
                    </button>

                    {(selectedPhoto.uploaderId?._id === user?._id || event?.role === 'ADMIN') && (
                      <button 
                        onClick={() => handleDeleteMedia(selectedPhoto._id)}
                        className="flex items-center justify-center p-1.5 rounded-full border border-rose-950 bg-rose-950/20 hover:bg-rose-950/55 hover:border-rose-500 text-rose-500 transition-all"
                        title="Delete photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button 
                    onClick={() => handleDownload(selectedPhoto)}
                    className="flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow shadow-rose-600/10 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Write a comment..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl glass-input text-slate-100"
                  />
                  <button 
                    type="submit" 
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-500 font-bold text-xs rounded-xl"
                  >
                    Send
                  </button>
                </form>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Event Members List Modal */}
      {isMembersListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMembersListOpen(false)}>
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl relative shadow-2xl animate-fade-in border-slate-800 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsMembersListOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg p-1"
            >
              ×
            </button>
            <h2 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Users className="text-rose-500" /> Event Members
            </h2>
            <p className="text-slate-400 text-xs mb-6">List of all approved members participating in this event.</p>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {members.map(member => (
                <div 
                  key={member._id} 
                  className="p-3 border border-slate-900 bg-slate-900/20 rounded-xl flex items-center justify-between text-xs gap-3 cursor-pointer group/mem"
                  onClick={() => {
                    setProfileUserId(member.userId._id);
                    setIsMembersListOpen(false);
                  }}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-xs text-slate-400 font-bold border border-slate-700 flex-shrink-0 group-hover/mem:border-rose-500 transition-colors">
                      {member.userId.profilePicture ? (
                        <img src={member.userId.profilePicture.startsWith('/') ? `http://localhost:5000${member.userId.profilePicture}` : member.userId.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : member.userId.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-200 truncate group-hover/mem:text-rose-450 transition-colors">{member.userId.name}</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider">{member.role}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover/mem:text-rose-500 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {profileUserId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setProfileUserId(null)}>
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl relative shadow-2xl animate-fade-in border-slate-850 text-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setProfileUserId(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg p-1"
            >
              ×
            </button>

            {profileLoading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
              </div>
            ) : profileUserData ? (
              <div className="space-y-4 mt-2">
                {/* Profile Picture */}
                <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-rose-500/50 mx-auto overflow-hidden flex items-center justify-center text-3xl text-slate-400 font-bold shadow-lg">
                  {profileUserData.profilePicture ? (
                    <img 
                      src={profileUserData.profilePicture.startsWith('/') ? `http://localhost:5000${profileUserData.profilePicture}` : profileUserData.profilePicture} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    profileUserData.name.charAt(0)
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-100">{profileUserData.name}</h3>
                  <p className="text-xs text-slate-550 font-semibold mt-0.5">{profileUserData.email}</p>
                </div>

                <div className="border-t border-slate-900 pt-4 mt-2">
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    {profileUserData.bio || `This user hasn't written a bio yet.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-xs text-slate-500">
                Failed to load user profile.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default EventDetails;
