import './App.css'
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Edit2, Trash2, X, Search, MapPin, Clock, Phone, FileText } from 'lucide-react';

const supabaseUrl = "https://ybkcxnetozrniwwletrt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlia2N4bmV0b3pybml3d2xldHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDkwMzksImV4cCI6MjA2NDk4NTAzOX0.3kUjWL0OJBV3N5HZDwJf9P4Wr1ER6KXEBJPJtrhEbxk";
const supabase = createClient(supabaseUrl, supabaseKey);

type Location = {
  id?: number;
  name: string;
  address: string;
  phone: string;
  open_time: string;
  close_time: string;
  city: string;
  state: string;
  notes: string[];
};

export default function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState<Location>({
    name: '',
    address: '',
    phone: '',
    open_time: '',
    close_time: '',
    city: '',
    state: '',
    notes: []
  });
  const [newNote, setNewNote] = useState<string>('');


  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    filterLocations();
  }, [locations, searchTerm, stateFilter]);

  const fetchLocations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pickup_locations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching locations:', error);
    } else {
      setLocations(data || []);
    }
    setLoading(false);
  };

  const filterLocations = () => {
    let filtered = [...locations];
    
    if (searchTerm) {
      filtered = filtered.filter(loc => 
        loc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (stateFilter !== 'all') {
      filtered = filtered.filter(loc => loc.state === stateFilter);
    }
    
    setFilteredLocations(filtered);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.address || !formData.city || !formData.state) {
      alert('Please fill in all required fields');
      return;
    }
    
    const locationData = {
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      open_time: formData.open_time,
      close_time: formData.close_time,
      city: formData.city,
      state: formData.state,
      notes: formData.notes
    };

    if (editingLocation) {
      const { error } = await supabase
        .from('pickup_locations')
        .update(locationData)
        .eq('id', editingLocation.id);
      
      if (error) {
        console.error('Error updating location:', error);
      }
    } else {
      const { error } = await supabase
        .from('pickup_locations')
        .insert([locationData]);
      
      if (error) {
        console.error('Error creating location:', error);
      }
    }
    
    fetchLocations();
    closeModal();
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this location?')) {
      const { error } = await supabase
        .from('pickup_locations')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting location:', error);
      } else {
        fetchLocations();
      }
    }
  };

  const openModal = (location?: Location | null) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address,
        phone: location.phone,
        open_time: location.open_time,
        close_time: location.close_time,
        city: location.city,
        state: location.state,
        notes: Array.isArray(location.notes) ? location.notes : []
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        open_time: '',
        close_time: '',
        city: '',
        state: '',
        notes: []
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLocation(null);
    setNewNote('');
  };

  const addNote = () => {
    if (newNote.trim()) {
      setFormData({
        ...formData,
        notes: [...formData.notes, newNote.trim()]
      });
      setNewNote('');
    }
  };

  const removeNote = (index: number) => {
    setFormData({
      ...formData,
      notes: formData.notes.filter((_, i) => i !== index)
    });
  };

  const uniqueStates = [...new Set(locations.map(loc => loc.state))].sort();
  const recentLocations = locations.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FromTo</h1>
          <p className="text-gray-600">Manage your delivery locations</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Location
            </button>
          </div>
        </div>

        {recentLocations.length > 0 && searchTerm === '' && stateFilter === 'all' && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recently Added</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentLocations.map(location => (
                <LocationCard
                  key={location.id}
                  location={location}
                  onEdit={() => openModal(location)}
                  onDelete={() => handleDelete(location.id)}
                  isRecent
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {searchTerm || stateFilter !== 'all' ? 'Filtered Locations' : 'All Locations'}
            <span className="text-gray-500 text-base ml-2">({filteredLocations.length})</span>
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-600">No locations found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLocations.map(location => (
                <LocationCard
                  key={location.id}
                  location={location}
                  onEdit={() => openModal(location)}
                  onDelete={() => handleDelete(location.id)}
                />
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingLocation ? 'Edit Location' : 'Add New Location'}
                </h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                      maxLength={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Open</label>
                      <input
                        type="text"
                        value={formData.open_time}
                        onChange={(e) => setFormData({...formData, open_time: e.target.value})}
                        placeholder="9:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Close</label>
                      <input
                        type="text"
                        value={formData.close_time}
                        onChange={(e) => setFormData({...formData, close_time: e.target.value})}
                        placeholder="17:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNote())}
                      placeholder="Add a note..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={addNote}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {formData.notes.length > 0 && (
                    <div className="space-y-2">
                      {formData.notes.map((note, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                          <span className="flex-1 text-sm">{note}</span>
                          <button
                            onClick={() => removeNote(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingLocation ? 'Update Location' : 'Create Location'}
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface LocationCardProps {
  location: Location;
  onEdit: () => void;
  onDelete: () => void;
  isRecent?: boolean;
}

function LocationCard({ location, onEdit, onDelete, isRecent }: LocationCardProps) {
  const notes = Array.isArray(location.notes) ? location.notes : [];
  
  return (
    <div className={`bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow ${isRecent ? 'border-l-4 border-blue-500' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2 text-gray-600">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{location.address}</span>
        </div>
        
        {location.phone && location.phone !== 'none' && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{location.phone}</span>
          </div>
        )}
        
        {location.open_time && location.close_time && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{location.open_time} - {location.close_time}</span>
          </div>
        )}
        
        {notes.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2 text-gray-600 mb-1">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="font-medium">Notes:</span>
            </div>
            <ul className="ml-6 space-y-1">
              {notes.map((note, index) => (
                <li key={index} className="text-gray-600 text-xs">• {note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {isRecent && (
        <div className="mt-3 pt-3 border-t">
          <span className="text-xs text-blue-600 font-medium">Recently Added</span>
        </div>
      )}
    </div>
  );
}