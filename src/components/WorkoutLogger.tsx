import React, { useState, useEffect } from 'react';
import { Plus, Minus, Save, RotateCcw, BookOpen, Trophy, TrendingUp, Star, X, Search } from 'lucide-react';
import { Exercise, WorkoutSet, Workout, WorkoutTemplate } from '../types';
import { formatDate, isToday } from '../utils/dateUtils';
import { getExerciseMaxReps, getExerciseAverageReps } from '../utils/maxRepUtils';

interface WorkoutLoggerProps {
  exercises: Exercise[];
  todaysWorkout: Workout | null;
  workouts: Workout[];
  templates: WorkoutTemplate[];
  onSaveWorkout: (workout: Omit<Workout, 'id'>) => void;
  onUpdateWorkout: (id: string, workout: Omit<Workout, 'id'>) => void;
  onAddTemplate?: (template: Omit<WorkoutTemplate, 'id' | 'createdAt'>) => void;
  onWorkoutDataChange?: (sets: Array<{ exerciseId: string; reps: number }>, notes: string) => void;
}

export function WorkoutLogger({ 
  exercises, 
  todaysWorkout, 
  workouts,
  templates,
  onSaveWorkout, 
  onUpdateWorkout,
  onAddTemplate,
  onWorkoutDataChange
}: WorkoutLoggerProps) {
  const [sets, setSets] = useState<Omit<WorkoutSet, 'id'>[]>([]);
  const [notes, setNotes] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Exercise['category'] | 'all'>('all');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [numberOfSets, setNumberOfSets] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { value: 'abs', label: 'Abs', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'arms', label: 'Arms', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'back', label: 'Back', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'cardio', label: 'Cardio', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'chest', label: 'Chest', color: 'bg-pink-100 text-pink-800 border-pink-200' },
    { value: 'full-body', label: 'Full Body', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { value: 'legs', label: 'Legs', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'shoulders', label: 'Shoulders', color: 'bg-gray-300 text-gray-700 border-gray-400' }
  ];

  // Sort exercises alphabetically
  const sortedExercises = [...exercises].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (todaysWorkout) {
      setSets(todaysWorkout.sets.map(set => ({
        exerciseId: set.exerciseId,
        reps: set.reps
      })));
      setNotes(todaysWorkout.notes || '');
    }
  }, [todaysWorkout]);

  useEffect(() => {
    if (sortedExercises.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(sortedExercises[0].id);
    }
  }, [sortedExercises, selectedExerciseId]);

  // Notify parent component when workout data changes (for autosave)
  useEffect(() => {
    if (onWorkoutDataChange) {
      onWorkoutDataChange(sets, notes);
    }
  }, [sets, notes, onWorkoutDataChange]);

  const addExerciseWithSets = () => {
    if (!selectedExerciseId || numberOfSets < 1) return;
    
    const newSets: Omit<WorkoutSet, 'id'>[] = [];
    for (let i = 0; i < numberOfSets; i++) {
      newSets.push({ exerciseId: selectedExerciseId, reps: 0 }); // Start with 0 reps to show placeholder
    }
    
    setSets([...sets, ...newSets]);
    setShowAddExercise(false);
    setNumberOfSets(3); // Reset to default
  };

  const addSingleSet = (exerciseId?: string) => {
    if (exerciseId) {
      // Find the last index of this exercise in the sets array
      let lastIndex = -1;
      for (let i = sets.length - 1; i >= 0; i--) {
        if (sets[i].exerciseId === exerciseId) {
          lastIndex = i;
          break;
        }
      }
      
      // Insert the new set right after the last set of this exercise
      const newSets = [...sets];
      newSets.splice(lastIndex + 1, 0, { exerciseId, reps: 0 });
      setSets(newSets);
    } else {
      // Fallback for when no specific exercise is provided
      const defaultExerciseId = (selectedCategory !== 'all' 
        ? sortedExercises.find(e => e.category === selectedCategory)?.id 
        : sortedExercises[0]?.id) || '';
      
      setSets([...sets, { exerciseId: defaultExerciseId, reps: 0 }]);
    }
  };

  const updateSet = (index: number, field: keyof Omit<WorkoutSet, 'id'>, value: any) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (sets.length === 0) return;

    const workout: Omit<Workout, 'id'> = {
      date: new Date(),
      sets: sets.map(set => ({
        ...set,
        id: crypto.randomUUID()
      })),
      notes: notes.trim() || undefined
    };

    if (todaysWorkout) {
      onUpdateWorkout(todaysWorkout.id, workout);
    } else {
      onSaveWorkout(workout);
    }

    // Reset form
    setSets([]);
    setNotes('');
  };

  const resetWorkout = () => {
    setSets([]);
    setNotes('');
  };

  const useTemplate = (template: WorkoutTemplate) => {
    const templateSets: Omit<WorkoutSet, 'id'>[] = [];
    template.exercises.forEach(templateExercise => {
      for (let i = 0; i < templateExercise.sets; i++) {
        templateSets.push({
          exerciseId: templateExercise.exerciseId,
          reps: 0 // Start with 0 reps to show placeholder
        });
      }
    });
    
    setSets(templateSets);
    setShowTemplates(false);
  };

  const handleSaveAsTemplate = () => {
    if (!templateName.trim() || sets.length === 0 || !onAddTemplate) return;

    // Group sets by exercise and count them
    const exerciseCounts = new Map<string, number>();
    sets.forEach(set => {
      exerciseCounts.set(set.exerciseId, (exerciseCounts.get(set.exerciseId) || 0) + 1);
    });

    // Convert to template format
    const templateExercises = Array.from(exerciseCounts.entries()).map(([exerciseId, count]) => ({
      exerciseId,
      sets: count
    }));

    onAddTemplate({
      name: templateName.trim(),
      exercises: templateExercises
    });

    setTemplateName('');
    setShowSaveTemplate(false);
  };

  const getStatsForSet = (exerciseId: string, setPosition: number) => {
    const threeMonthMax = getExerciseMaxReps(workouts, exerciseId, '3months');
    const threeMonthAvg = getExerciseAverageReps(workouts, exerciseId, '3months');
    
    const threeMonthMaxRecord = threeMonthMax.find(record => record.setPosition === setPosition);
    const threeMonthAvgRecord = threeMonthAvg.find(record => record.setPosition === setPosition);
    
    return {
      max: threeMonthMaxRecord?.maxReps || 0,
      average: threeMonthAvgRecord?.averageReps || 0
    };
  };

  const getSetPositionForExercise = (exerciseId: string, currentIndex: number) => {
    // Count how many sets of this exercise come before the current index
    let position = 1;
    for (let i = 0; i < currentIndex; i++) {
      if (sets[i].exerciseId === exerciseId) {
        position++;
      }
    }
    return position;
  };

  const getExerciseSetNumber = (exerciseId: string, currentIndex: number) => {
    // Count how many sets of this specific exercise come before the current index
    let setNumber = 1;
    for (let i = 0; i < currentIndex; i++) {
      if (sets[i].exerciseId === exerciseId) {
        setNumber++;
      }
    }
    return setNumber;
  };

  const getCategoryStyle = (category: Exercise['category']) => {
    return categories.find(c => c.value === category)?.color || 'bg-solarized-base1/10 text-solarized-base01 border-solarized-base1/20';
  };

  const getCategoryBackgroundStyle = (category: Exercise['category']) => {
    const categoryConfig = categories.find(c => c.value === category);
    if (!categoryConfig) return 'bg-solarized-base2 border-solarized-base1';
    
    switch (category) {
      case 'abs':
        return 'bg-yellow-100 border-yellow-200';
      case 'legs':
        return 'bg-green-100 border-green-200';
      case 'arms':
        return 'bg-blue-100 border-blue-200';
      case 'back':
        return 'bg-purple-100 border-purple-200';
      case 'shoulders':
        return 'bg-gray-300 border-gray-400';
      case 'chest':
        return 'bg-[#6F826A] border-[#6F826A]';
      case 'cardio':
        return 'bg-[#F6F0F0] border-[#F6F0F0]';
      case 'full-body':
        return 'bg-[#5C7285] border-[#5C7285]';
      default:
        return 'bg-solarized-base2 border-solarized-base1';
    }
  };

  const getPlaceholderText = (exerciseId: string, setPosition: number) => {
    const stats = getStatsForSet(exerciseId, setPosition);
    const parts = [];
    
    if (stats.max > 0) {
      parts.push(`↑${stats.max}`);
    }
    if (stats.average > 0) {
      parts.push(`⌀${stats.average}`);
    }
    
    return parts.length > 0 ? parts.join(' ') : 'Enter reps';
  };

  const incrementSets = () => {
    setNumberOfSets(prev => Math.min(prev + 1, 10));
  };

  const decrementSets = () => {
    setNumberOfSets(prev => Math.max(prev - 1, 1));
  };

  const filteredExercises = selectedCategory === 'all' 
    ? sortedExercises 
    : sortedExercises.filter(ex => ex.category === selectedCategory);

  // Further filter by search query
  const searchFilteredExercises = searchQuery.trim() 
    ? filteredExercises.filter(ex => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.description && ex.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        categories.find(c => c.value === ex.category)?.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredExercises;

  // Group consecutive sets by exercise
  const groupedSets = () => {
    const groups: Array<{
      exerciseId: string;
      exercise: Exercise | undefined;
      sets: Array<{ set: Omit<WorkoutSet, 'id'>; originalIndex: number; setNumber: number }>;
    }> = [];

    let currentGroup: typeof groups[0] | null = null;
    let exerciseSetCounts = new Map<string, number>();

    sets.forEach((set, index) => {
      const exercise = sortedExercises.find(e => e.id === set.exerciseId);
      const setNumber = (exerciseSetCounts.get(set.exerciseId) || 0) + 1;
      exerciseSetCounts.set(set.exerciseId, setNumber);

      if (!currentGroup || currentGroup.exerciseId !== set.exerciseId) {
        // Start a new group
        currentGroup = {
          exerciseId: set.exerciseId,
          exercise,
          sets: []
        };
        groups.push(currentGroup);
      }

      currentGroup.sets.push({ set, originalIndex: index, setNumber });
    });

    return groups;
  };

  if (sortedExercises.length === 0) {
    return (
      <div className="p-6 pb-24 bg-solarized-base3 min-h-screen">
        <div className="text-center py-12">
          <p className="text-solarized-base01 mb-4">No exercises available</p>
          <p className="text-sm text-solarized-base1">Add some exercises first to start logging workouts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 space-y-6 bg-solarized-base3 min-h-screen">
      {/* Workout Header */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-solarized-base02">
            {formatDate(new Date())}
          </h2>
        </div>
        
        {todaysWorkout && (
          <div className="bg-solarized-green/10 p-3 rounded-lg mb-4 border border-solarized-green/20">
            <p className="text-sm text-solarized-base02">
              You've already logged a workout today. You can continue adding sets or update your existing workout.
            </p>
          </div>
        )}

        {/* Template and Save Actions */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="bg-solarized-violet text-solarized-base3 border-none py-3 px-4 rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 ease-in-out hover:bg-solarized-violet/90 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 min-h-12"
          >
            <BookOpen size={18} />
            Use Template
          </button>
          
          {sets.length > 0 && onAddTemplate && (
            <button
              onClick={() => setShowSaveTemplate(!showSaveTemplate)}
              className="bg-solarized-yellow text-solarized-base3 border-none py-3 px-4 rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200 ease-in-out hover:bg-solarized-yellow/90 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 min-h-12"
            >
              <Star size={18} />
              Save Template
            </button>
          )}
        </div>

        {showTemplates && (
          <div className="mt-4 p-4 bg-solarized-base1/10 rounded-lg border border-solarized-base1/20">
            <h4 className="font-medium text-solarized-base02 mb-3">Choose a template:</h4>
            {templates.length === 0 ? (
              <p className="text-solarized-base01 text-sm">No templates available. Create one in the Templates tab.</p>
            ) : (
              <div className="space-y-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => useTemplate(template)}
                    className="w-full text-left p-3 bg-solarized-base3 rounded-lg hover:bg-solarized-violet/10 border border-solarized-base1 hover:border-solarized-violet/20 transition-colors"
                  >
                    <div className="font-medium text-solarized-base02">{template.name}</div>
                    <div className="text-sm text-solarized-base01">
                      {template.exercises.length} exercises, {template.exercises.reduce((total, ex) => total + ex.sets, 0)} total sets
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {showSaveTemplate && (
          <div className="mt-4 p-4 bg-solarized-yellow/10 rounded-lg border border-solarized-yellow/20">
            <h4 className="font-medium text-solarized-base02 mb-3">Save current workout as template:</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name (e.g., Today's Workout)"
                className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-yellow focus:border-transparent bg-solarized-base3 text-solarized-base02"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveAsTemplate}
                  disabled={!templateName.trim()}
                  className="flex-1 bg-solarized-yellow text-solarized-base3 border-none py-3 px-4 rounded-lg cursor-pointer font-semibold transition-all duration-200 ease-in-out hover:bg-solarized-yellow/90 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-solarized-base1 disabled:cursor-not-allowed disabled:text-solarized-base01 disabled:hover:translate-y-0 min-h-12"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveTemplate(false);
                    setTemplateName('');
                  }}
                  className="flex-1 bg-solarized-base1 text-solarized-base02 border-none py-3 px-4 rounded-lg cursor-pointer font-semibold transition-all duration-200 ease-in-out hover:bg-solarized-base0 hover:-translate-y-0.5 active:translate-y-0 min-h-12"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grouped Sets */}
      <div className="space-y-4">
        {groupedSets().map((group, groupIndex) => (
          <div key={`${group.exerciseId}-${groupIndex}`} className={`rounded-xl p-4 shadow-lg border ${
            group.exercise ? getCategoryBackgroundStyle(group.exercise.category) : 'bg-solarized-base2 border-solarized-base1'
          }`}>
            {/* Exercise Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-solarized-base02 text-lg">
                  {group.exercise?.name || 'Unknown Exercise'}
                </h3>
                {group.exercise && (
                  <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryStyle(group.exercise.category)}`}>
                    {categories.find(c => c.value === group.exercise!.category)?.label}
                  </span>
                )}
              </div>
              <span className="text-sm text-solarized-base01 bg-solarized-base1/20 px-3 py-1 rounded-full">
                {group.sets.length} set{group.sets.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Sets for this exercise */}
            <div className="grid grid-cols-2 gap-2">
              {group.sets.map(({ set, originalIndex, setNumber }) => {
                const setPosition = getSetPositionForExercise(set.exerciseId, originalIndex);
                
                return (
                  <div key={originalIndex} className="bg-solarized-base1/10 rounded-lg p-2 border border-solarized-base1/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-solarized-base02">
                        Set {setNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => removeSet(originalIndex)}
                          className="p-0.5 text-solarized-red hover:bg-solarized-red/10 rounded"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                    
                    <input
                      type="number"
                      step="0.01"
                      value={set.reps || ''}
                      onChange={(e) => updateSet(originalIndex, 'reps', parseFloat(e.target.value) || 0)}
                      placeholder={getPlaceholderText(set.exerciseId, setPosition)}
                      className="w-full p-2 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent text-lg font-bold bg-solarized-base3 text-solarized-base02 placeholder-gray-400 placeholder:text-xs text-center"
                      min="0"
                    />
                  </div>
                );
              })}
            </div>

            {/* Add another set of this exercise */}
            <button
              onClick={() => addSingleSet(group.exerciseId)}
              className="w-full mt-3 bg-solarized-base3/50 text-solarized-base02 border border-solarized-base1/30 py-2 px-4 rounded-lg cursor-pointer font-medium transition-all duration-200 ease-in-out hover:bg-solarized-base3 hover:border-solarized-base1/50 flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Another Set
            </button>
          </div>
        ))}
      </div>

      {/* Add Exercise Button - Always at bottom after all sets */}
      {!showAddExercise ? (
        <button
          onClick={() => setShowAddExercise(true)}
          className="w-full bg-solarized-blue text-solarized-base3 border-none py-3 px-4 rounded-lg cursor-pointer font-semibold transition-all duration-200 ease-in-out hover:bg-solarized-blue/90 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 min-h-12"
        >
          <Plus size={20} />
          Add Exercise
        </button>
      ) : (
        <div className="bg-solarized-base2 rounded-xl p-4 shadow-lg border border-solarized-base1">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-solarized-base01" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                className="w-full pl-10 pr-4 py-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02 placeholder-solarized-base01"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X size={16} className="text-solarized-base01 hover:text-solarized-base02" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-solarized-base01 mb-2">
                  Exercise
                </label>
                <select
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02"
                >
                  {searchQuery ? (
                    // When searching, show all matching exercises without category grouping
                    searchFilteredExercises.length > 0 ? (
                      searchFilteredExercises.map(exercise => (
                        <option key={exercise.id} value={exercise.id}>
                          {exercise.name} ({categories.find(c => c.value === exercise.category)?.label})
                        </option>
                      ))
                    ) : (
                      <option disabled>No exercises found matching "{searchQuery}"</option>
                    )
                  ) : (
                    // When not searching, show grouped by category
                    categories.map(category => {
                      const categoryExercises = searchFilteredExercises.filter(ex => ex.category === category.value);
                    if (categoryExercises.length === 0) return null;
                    
                    return (
                      <optgroup key={category.value} label={category.label}>
                        {categoryExercises.map(exercise => (
                          <option key={exercise.id} value={exercise.id}>
                            {exercise.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                    })
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-solarized-base01 mb-2">
                  Number of Sets
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={decrementSets}
                    className="bg-solarized-base1/30 text-solarized-base01 border-none p-2 rounded-lg cursor-pointer transition-all duration-200 ease-in-out hover:bg-solarized-base1/50 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={numberOfSets}
                    onChange={(e) => setNumberOfSets(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="flex-1 p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02 text-center"
                    min="1"
                    max="10"
                  />
                  <button
                    type="button"
                    onClick={incrementSets}
                    className="bg-solarized-base1/30 text-solarized-base01 border-none p-2 rounded-lg cursor-pointer transition-all duration-200 ease-in-out hover:bg-solarized-base1/50 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={addExerciseWithSets}
                disabled={!selectedExerciseId || numberOfSets < 1 || searchFilteredExercises.length === 0}
                className="bg-solarized-green text-solarized-base3 border-none py-2 px-4 rounded-lg cursor-pointer font-semibold transition-all duration-200 ease-in-out hover:bg-solarized-green/90 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-solarized-base1 disabled:cursor-not-allowed disabled:text-solarized-base01 disabled:hover:translate-y-0 min-h-12"
              >
                Add {numberOfSets} Set{numberOfSets !== 1 ? 's' : ''}
              </button>
              <button
                onClick={() => {
                  setShowAddExercise(false);
                  setSearchQuery('');
                }}
                className="bg-solarized-base1 text-solarized-base02 border-none py-2 px-4 rounded-lg cursor-pointer font-semibold transition-all duration-200 ease-in-out hover:bg-solarized-base0 hover:-translate-y-0.5 active:translate-y-0 min-h-12"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Notes */}
      <div className="bg-solarized-base2 rounded-xl p-4 shadow-lg border border-solarized-base1">
        <label className="block text-sm font-medium text-solarized-base01 mb-2">
          Workout Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02"
          placeholder="How was your workout today?"
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      {sets.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-solarized-green text-solarized-base3 border-none py-3 px-4 rounded-lg cursor-pointer font-semibold transition-all duration-200 ease-in-out hover:bg-solarized-green/90 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 min-h-12"
          >
            <Save size={20} />
            {todaysWorkout ? 'Update Workout' : 'Save Workout'}
          </button>
          <button
            onClick={resetWorkout}
            className="bg-solarized-base1 text-solarized-base02 border-none px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out hover:bg-solarized-base0 hover:-translate-y-0.5 active:translate-y-0 min-h-12"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      )}
    </div>
  );
}