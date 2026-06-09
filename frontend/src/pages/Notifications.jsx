import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Heart, MessageSquare, UserPlus, CheckCircle2, XCircle, Bell, Clock, ChevronRight } from 'lucide-react';

const Notifications = () => {
  const { notifications, markAsRead } = useNotifications();
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    markAsRead();
  }, []);

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'LIKE':
        return { icon: <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />, bg: 'bg-rose-500/5 border-rose-500/10' };
      case 'COMMENT':
        return { icon: <MessageSquare className="w-5 h-5 text-sky-400" />, bg: 'bg-sky-400/5 border-sky-400/10' };
      case 'TAG':
        return { icon: <Bell className="w-5 h-5 text-violet-400" />, bg: 'bg-violet-400/5 border-violet-400/10' };
      case 'JOIN_REQUEST':
        return { icon: <UserPlus className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-500/5 border-amber-500/10' };
      case 'JOIN_APPROVED':
        return { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, bg: 'bg-emerald-400/5 border-emerald-400/10' };
      case 'JOIN_DENIED':
        return { icon: <XCircle className="w-5 h-5 text-rose-400" />, bg: 'bg-rose-400/5 border-rose-400/10' };
      default:
        return { icon: <Bell className="w-5 h-5 text-slate-400" />, bg: 'bg-slate-800/10 border-slate-800/20' };
    }
  };

  const handleNotificationClick = async (notification) => {
    const { type, relatedId } = notification;

    if (type === 'LIKE' || type === 'COMMENT' || type === 'TAG') {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/media/${relatedId}/info`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          navigate(`/events/${data.eventId}?mediaId=${data.mediaId}`);
        } else {
          alert('This photo has been deleted and is no longer available.');
        }
      } catch (err) {
        console.error('Error fetching media info:', err);
      }
    } else if (type === 'JOIN_REQUEST' || type === 'JOIN_APPROVED' || type === 'JOIN_DENIED') {
      navigate(`/events/${relatedId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 mt-8">

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
            <Bell className="text-rose-500 w-8 h-8" />
            Notifications Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time updates on likes, comments, photo tags, and society join approvals
          </p>
        </div>

        {notifications.length === 0 ? (
          <div className="glass-panel text-center py-20 rounded-3xl border-slate-900">
            <Bell className="w-12 h-12 text-slate-800 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-400">All caught up</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              Any alerts regarding your event activity or photo interactions will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const { icon, bg } = getNotificationStyle(notification.type);
              const sender = notification.senderId;
              const isUnread = !notification.isRead;
              
              const formattedTime = new Date(notification.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`glass-card p-4 rounded-xl flex items-center justify-between border cursor-pointer group hover:bg-slate-900/60 transition-all ${bg} ${isUnread ? 'border-rose-500/20 bg-slate-900/80 shadow-md' : 'border-slate-900 bg-slate-900/20'}`}
                >
                  <div className="flex items-center gap-4 min-w-0">

                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0">
                      {icon}
                    </div>

                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {sender?.profilePicture ? (
                        <img 
                          src={sender.profilePicture.startsWith('/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${sender.profilePicture}` : sender.profilePicture} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-slate-400 text-xs font-bold">{sender?.name?.charAt(0)}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className={`text-sm leading-normal truncate ${isUnread ? 'text-slate-100 font-semibold' : 'text-slate-300 font-medium'}`}>
                        {notification.message}
                      </p>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formattedTime}
                      </span>
                    </div>

                  </div>

                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
};

export default Notifications;
