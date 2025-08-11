import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Dumbbell, Filter } from 'lucide-react';
import { Exercise } from '../types';

interface ExerciseListProps {
  exercises: Exercise[];
  onAddExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => void;
  onEditExercise: (id: string, exercise: Omit<Exercise, 'id' | 'createdAt'>) => void;
  onDeleteExercise: (id: string) => void;
}

export function ExerciseList({ exercises, onAddExercise, onEditExercise, onDeleteExercise }: ExerciseListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Exercise['category'] | 'all'>('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'abs' as Exercise['category']
  });

  const categories = [
    { value: 'abs', label: 'Abs', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'legs', label: 'Legs', color: 'bg-[#A7C1A8] text-white border-[#A7C1A8]' },
    { value: 'arms', label: 'Arms', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'back', label: 'Back', color: 'bg-[#898AC4] text-white border-[#898AC4]' },
    { value: 'shoulders', label: 'Shoulders', color: 'bg-gray-300 text-gray-700 border-gray-400' },
    { value: 'chest', label: 'Chest', color: 'bg-[#FFE6A9] text-gray-800 border-[#FFE6A9]' },
    { value: 'cardio', label: 'Cardio', color: 'bg-[#819A91] text-white border-[#819A91]' },
    { value: 'full-body', label: 'Full Body', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    if (!formData.name.trim()) {
      console.log('No name provided, aborting');
      return;
    }

    try {
      const exerciseData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category
      };
      
      console.log('Calling onAddExercise/onEditExercise with:', exerciseData);

      if (editingId) {
        onEditExercise(editingId, exerciseData);
        setEditingId(null);
        console.log('Exercise edited successfully');
      } else {
        onAddExercise(exerciseData);
        console.log('Exercise added successfully');
      }

      // Reset form
      setFormData({ name: '', description: '', category: 'abs' });
      setShowForm(false);
      
    } catch (error) {
      console.error('Error saving exercise:', error);
      alert('Error saving exercise: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setFormData({
      name: exercise.name,
      description: exercise.description || '',
      category: exercise.category
    });
    setEditingId(exercise.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', category: 'abs' });
    setEditingId(null);
    setShowForm(false);
  };

  const getCategoryStyle = (category: Exercise['category']) => {
    const categoryConfig = categories.find(c => c.value === category);
    if (categoryConfig) {
      return categoryConfig.color;
    }
    // Default color for custom/unknown categories
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const filteredExercises = selectedCategory === 'all' 
    ? exercises 
    : exercises.filter(ex => ex.category === selectedCategory);

  const exercisesByCategory = categories.map(category => ({
    ...category,
    exercises: exercises.filter(ex => ex.category === category.value),
    count: exercises.filter(ex => ex.category === category.value).length
  }));

  // Sort exercises alphabetically
  const sortedExercises = [...filteredExercises].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-6 pb-24 space-y-6 bg-solarized-base3 min-h-screen">
      {/* Add Exercise Button */}
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-solarized-blue text-solarized-base3 py-3 px-4 rounded-lg font-medium hover:bg-solarized-blue/90 transition-colors flex items-center justify-center gap-2 shadow-md"
      >
        <Plus size={20} />
        Add New Exercise
      </button>

      {/* Category Filter */}
      <div className="bg-solarized-base2 rounded-xl p-4 shadow-lg border border-solarized-base1">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-solarized-base01" />
          <h3 className="font-medium text-solarized-base02">Filter by Category</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              selectedCategory === 'all'
                ? 'bg-solarized-base02 text-solarized-base3 border-solarized-base02'
                : 'bg-solarized-base2 text-solarized-base01 hover:bg-solarized-base1 border-solarized-base1'
            }`}
          >
            All ({exercises.length})
          </button>
          {exercisesByCategory.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value as Exercise['category'])}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 border ${
                selectedCategory === category.value
                  ? 'bg-solarized-blue text-solarized-base3 border-solarized-blue'
                  : 'bg-solarized-base2 text-solarized-base01 hover:bg-solarized-base1 border-solarized-base1'
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Form */}
      {showForm && (
        <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
          <h3 className="text-lg font-semibold mb-4 text-solarized-base02">
            {editingId ? 'Edit Exercise' : 'Add New Exercise'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-solarized-base01 mb-2">
                Exercise Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02"
                placeholder="e.g., Push-ups"
                required
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-solarized-base01 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02"
                placeholder="Brief description of the exercise"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-solarized-base01 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Exercise['category'] })}
                className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02"
                required
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-solarized-blue text-solarized-base3 py-3 px-4 rounded-lg font-medium hover:bg-solarized-blue/90 transition-colors shadow-md"
              >
                {editingId ? 'Update Exercise' : 'Add Exercise'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-solarized-base1 text-solarized-base02 py-3 px-4 rounded-lg font-medium hover:bg-solarized-base0 transition-colors shadow-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exercise List */}
      <div className="space-y-3">
        {sortedExercises.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell size={48} className="mx-auto text-solarized-base1 mb-4" />
            <p className="text-solarized-base01 mb-4">
              {selectedCategory === 'all' ? 'No exercises yet' : `No ${categories.find(c => c.value === selectedCategory)?.label.toLowerCase()} exercises yet`}
            </p>
            <p className="text-sm text-solarized-base1">Add your first exercise to get started</p>
          </div>
        ) : (
          sortedExercises.map((exercise) => (
            <div key={exercise.id} className="bg-solarized-base2 rounded-xl p-4 shadow-lg border border-solarized-base1">
              <div className="space-y-2">
                <div>
                  <h3 className="font-semibold text-solarized-base02 truncate">{exercise.name}</h3>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getCategoryStyle(exercise.category)}`}>
                    {categories.find(c => c.value === exercise.category)?.label}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(exercise)}
                      className="p-2 text-solarized-base01 hover:text-solarized-blue hover:bg-solarized-blue/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteExercise(exercise.id)}
                      className="p-2 text-solarized-base01 hover:text-solarized-red hover:bg-solarized-red/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {exercise.description && (
                  <p className="text-sm text-solarized-base01 break-words">{exercise.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}