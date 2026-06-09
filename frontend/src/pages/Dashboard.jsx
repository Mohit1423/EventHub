import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Plus, Search, Calendar, Tag, Lock, Unlock, ArrowUpDown, Shield, Check, Clock, ExternalLink } from 'lucide-react';

const Dashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Photoshoot');
  const [isPublic, setIsPublic] = useState(true);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const categories = ['All', 'Photoshoot', 'Workshop', 'Trip', 'Competition', 'Cultural Fest', 'Party'];

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, date, category, isPublic }),
      });

      if (response.ok) {
       
        setName('');
        setDescription('');
        setDate('');
        setCategory('Photoshoot');
        setIsPublic(true);
        setIsModalOpen(false);
        fetchEvents();
      } else {
        const data = await response.json();
        setCreateError(data.message || 'Failed to create event.');
      }
    } catch (err) {
      setCreateError('Server connection error.');
    } finally {
      setCreating(false);
    }
  };

  const handleRequestAccess = async (eventId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/events/${eventId}/join-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
       
        fetchEvents();
      } else {
        const data = await response.json();
        alert(data.message || 'Request failed');
      }
    } catch (err) {
      console.error('Join request error:', err);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredEvents = events
    .filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase()) || 
                            event.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || event.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 mt-8">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
              Events Directory
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Browse public media hubs or request access to private society albums
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="self-start md:self-auto px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-600/10 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>

        <div className="glass-panel p-4 rounded-2xl mb-8 flex flex-col gap-4 border-slate-900">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">

            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3.5 top-3.5 text-slate-500 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder="Search event names or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm glass-input text-slate-100 placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto text-xs font-semibold text-slate-400">
              <span className="uppercase tracking-wider mr-1">Sort By:</span>
              <button 
                onClick={() => handleSort('name')} 
                className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-all ${sortBy === 'name' ? 'border-rose-500/30 text-rose-400 bg-rose-500/5' : 'border-slate-800 hover:border-slate-700'}`}
              >
                Name <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handleSort('date')} 
                className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-all ${sortBy === 'date' ? 'border-rose-500/30 text-rose-400 bg-rose-500/5' : 'border-slate-800 hover:border-slate-700'}`}
              >
                Date <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => handleSort('category')} 
                className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-all ${sortBy === 'category' ? 'border-rose-500/30 text-rose-400 bg-rose-500/5' : 'border-slate-800 hover:border-slate-700'}`}
              >
                Category <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-900">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${categoryFilter === cat ? 'bg-rose-600 border-rose-500 text-white font-semibold' : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="glass-panel text-center py-16 rounded-3xl border-slate-900">
            <Search className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No events found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto leading-normal">
              Try adjusting your search criteria or register a new event using the button above.
            </p>
          </div>
        ) : (
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const eventDateString = new Date(event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              return (
                <div key={event._id} className="glass-card flex flex-col justify-between p-6 rounded-2xl relative group border-slate-900 overflow-hidden">

                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="relative">
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-rose-500" />
                        {event.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-rose-500 transition-colors line-clamp-1">
                      {event.name}
                    </h3>
                    <p className="text-slate-400 text-xs mt-1.5 h-10 line-clamp-2 leading-relaxed">
                      {event.description || 'No description provided.'}
                    </p>

                    <div className="mt-5 space-y-2 border-t border-slate-900 pt-4 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-600" />
                        <span>{eventDateString}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-600" />
                        <span>Organized by: <span className="text-slate-400 font-semibold">{event.creator.name}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 relative">
                    <button
                      onClick={() => navigate(`/events/${event._id}`)}
                      className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-rose-500 border border-slate-800/80 hover:border-rose-500/20 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all"
                    >
                      Open Album <ExternalLink className="w-4 h-4" />
                      {event.isMember && (
                        <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-bold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Member
                        </span>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl relative shadow-2xl animate-fade-in border-slate-800" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              Create Event Album
            </h2>
            <p className="text-slate-400 text-xs mb-5">
              Initialize a media gallery for your upcoming workshop, trip, or photoshoot.
            </p>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-4">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Event Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Annual Trek 2026"
                  className="w-full p-3 text-sm glass-input text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a brief overview of the event, organizers, and timeline..."
                  className="w-full p-3 h-20 text-sm glass-input text-slate-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 text-sm glass-input text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 text-sm glass-input text-slate-100 bg-slate-950 focus:bg-slate-950"
                  >
                    {categories.slice(1).map(cat => (
                      <option key={cat} value={cat} className="bg-slate-950">{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
