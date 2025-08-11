import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { WorkoutTarget, Exercise, Workout } from '../types';

interface TargetsProps {
  targets: WorkoutTarget[];
  exercises: Exercise[];
  workouts: Workout[];
  onAddTarget: (target: Omit<WorkoutTarget, 'id' | 'createdAt'>) => void;
  onEditTarget: (id: string, target: Omit<WorkoutTarget, 'id' | 'createdAt'>) => void;
  onDeleteTarget: (id: string) => void;
}

export function Targets({ targets, exercises, workouts, onAddTarget, onEditTarget, onDeleteTarget }: TargetsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'sets' as 'sets' | 'reps',
    category: '' as string,
    exerciseId: '',
    targetValue: 0,
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    isActive: true
  });

  const categories = [
    { value: 'abs', label: 'Abs', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'arms', label: 'Arms', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'back', label: 'Back', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'cardio', label: 'Cardio', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'chest', label: 'Chest', color: 'bg-pink-100 text-pink-800 border-pink-200' },
    { value: 'full-body', label: 'Full Body', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { value: 'legs', label: 'Legs', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'shoulders', label: 'Shoulders', color: 'bg-gray-300 text-gray-700 border-gray-400' }
  ].sort((a, b) => a.label.localeCompare(b.label));

  const sortedExercises = [...exercises].sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.targetValue <= 0) return;

    const targetData = {
      name: formData.name.trim(),
      type: formData.type,
      category: formData.category || undefined,
      exerciseId: formData.exerciseId || undefined,
      targetValue: formData.targetValue,
      period: formData.period,
      isActive: formData.isActive
    };

    if (editingId) {
      onEditTarget(editingId, targetData);
      setEditingId(null);
    } else {
      onAddTarget(targetData);
    }

    setFormData({
      name: '',
      type: 'sets',
      category: '',
      exerciseId: '',
      targetValue: 0,
      period: 'weekly',
      isActive: true
    });
    setShowForm(false);
  };

  const handleEdit = (target: WorkoutTarget) => {
    setFormData({
      name: target.name,
      type: target.type,
      category: target.category || '',
      exerciseId: target.exerciseId || '',
      targetValue: target.targetValue,
      period: target.period,
      isActive: target.isActive
    });
    setEditingId(target.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      type: 'sets',
      category: '',
      exerciseId: '',
      targetValue: 0,
      period: 'weekly',
      isActive: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const calculateProgress = (target: WorkoutTarget) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (target.period) {
      case 'weekly':
        // Get Monday of current week
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        startDate = new Date(now);
        startDate.setDate(now.getDate() + mondayOffset);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
    }

    const relevantWorkouts = workouts.filter(workout => 
      new Date(workout.date) >= startDate && new Date(workout.date) <= now
    );

    let currentValue = 0;

    if (target.exerciseId) {
      // Specific exercise target
      relevantWorkouts.forEach(workout => {
        workout.sets.forEach(set => {
          if (set.exerciseId === target.exerciseId) {
            if (target.type === 'sets') {
              currentValue += 1;
            } else {
              currentValue += set.reps;
            }
          }
        });
      });
    } else if (target.category) {
      // Category target
      relevantWorkouts.forEach(workout => {
        workout.sets.forEach(set => {
          const exercise = exercises.find(ex => ex.id === set.exerciseId);
          if (exercise && exercise.category === target.category) {
            if (target.type === 'sets') {
              currentValue += 1;
            } else {
              currentValue += set.reps;
            }
          }
        });
      });
    }

    const percentage = (currentValue / target.targetValue) * 100;
    const isCompleted = currentValue >= target.targetValue;
    const isExceeded = currentValue > target.targetValue;

    // Calculate days remaining
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysPassed);

    // Determine status and color
    let status: 'completed' | 'on-track' | 'moderate' | 'needs-attention';
    let statusColor: string;
    let statusIcon: string;
    let progressBarColor: string;

    if (isCompleted) {
      status = 'completed';
      statusColor = 'text-solarized-green';
      statusIcon = '🟢';
      progressBarColor = 'bg-solarized-green';
    } else if (percentage >= 75) {
      status = 'on-track';
      statusColor = 'text-solarized-blue';
      statusIcon = '🔵';
      progressBarColor = 'bg-solarized-blue';
    } else if (percentage >= 50) {
      status = 'moderate';
      statusColor = 'text-solarized-yellow';
      statusIcon = '🟡';
      progressBarColor = 'bg-solarized-yellow';
    } else {
      status = 'needs-attention';
      statusColor = 'text-solarized-orange';
      statusIcon = '🟠';
      progressBarColor = 'bg-solarized-orange';
    }

    // If exceeded, use violet color
    if (isExceeded) {
      statusColor = 'text-solarized-violet';
      statusIcon = '🟣';
      progressBarColor = 'bg-solarized-violet';
    }

    return { 
      currentValue, 
      percentage, 
      isCompleted, 
      isExceeded, 
      daysRemaining,
      status,
      statusColor,
      statusIcon,
      progressBarColor
    };
  };

  const getCategoryStyle = (category: string) => {
    return categories.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'on-track':
        return 'On Track';
      case 'moderate':
        return 'Moderate Progress';
      case 'needs-attention':
        return 'Needs Attention';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 pb-24 space-y-6 bg-solarized-base3 min-h-screen">
      {/* Add Target Button */}
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-solarized-blue text-solarized-base3 py-3 px-4 rounded-lg font-medium hover:bg-solarized-blue/90 transition-colors flex items-center justify-center gap-2 shadow-md"
      >
        <Plus size={20} />
        Add New Target
      </button>

      {/* Target Form */}
      {showForm && (
        <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
          <h3 className="text-lg font-semibold mb-4 text-solarized-base02">
            {editingId ? 'Edit Target' : 'Add New Target'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-solarized-base01 mb-2">
                Target Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02"
                placeholder="e.g., Monthly Abs Goal"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-solarized-base01 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'sets' | 'reps' })}
                  className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02"
                  required
                >
                  <option value="sets">Sets</option>
                  <option value="reps">Reps</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-solarized-base01 mb-2">
                  Period *
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as 'weekly' | 'monthly' | 'yearly' })}
                  className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02"
                  required
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-solarized-base01 mb-2">
                Target Value *
              </label>
              <input
                type="number"
                value={formData.targetValue || ''}
                onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-orange focus:border-transparent bg-solarized-base3 text-solarized-base02"
                placeholder="Enter target value"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-solarized-base01 mb-2">
                Category (optional)
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, exerciseId: formData.exerciseId && exercises.find(ex => ex.id === formData.exerciseId)?.category === e.target.value ? formData.exerciseId : '' })}
                className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02"
              >
                <option value="">All categories</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-solarized-base01 mb-2">
                Specific Exercise (optional)
              </label>
              <select
                value={formData.exerciseId}
                onChange={(e) => setFormData({ ...formData, exerciseId: e.target.value, category: e.target.value ? exercises.find(ex => ex.id === e.target.value)?.category || '' : formData.category })}
                className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-blue focus:border-transparent bg-solarized-base3 text-solarized-base02"
              >
                <option value="">No specific exercise</option>
                {categories.map(category => {
                  const categoryExercises = sortedExercises.filter(ex => ex.category === category.value);
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
                })}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-solarized-blue text-solarized-base3 py-3 px-4 rounded-lg font-medium hover:bg-solarized-blue/90 transition-colors shadow-md"
              >
                {editingId ? 'Update Target' : 'Add Target'}
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

      {/* Targets List */}
      <div className="space-y-4">
        {targets.length === 0 ? (
          <div className="text-center py-12">
            <Target size={48} className="mx-auto text-solarized-base1 mb-4" />
            <p className="text-solarized-base01 mb-4">No targets set yet</p>
            <p className="text-sm text-solarized-base1">Create your first target to track your progress</p>
          </div>
        ) : (
          targets
            .filter(target => target.isActive)
            .map((target) => {
              const progress = calculateProgress(target);
              const exercise = target.exerciseId ? exercises.find(ex => ex.id === target.exerciseId) : null;
              
              return (
                <div key={target.id} className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
                  {/* Header with Title and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-solarized-base02 mb-2">{target.name}</h3>
                      
                      {/* Info Badges */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-solarized-blue/10 text-solarized-blue border border-solarized-blue/20">
                          {target.period}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-solarized-green/10 text-solarized-green border border-solarized-green/20">
                          {target.type}
                        </span>
                        {target.category && (
                          <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryStyle(target.category)}`}>
                            {categories.find(c => c.value === target.category)?.label}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(target)}
                        className="p-2 text-solarized-base01 hover:text-solarized-blue hover:bg-solarized-blue/10 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteTarget(target.id)}
                        className="p-2 text-solarized-base01 hover:text-solarized-red hover:bg-solarized-red/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-3">
                    {/* Progress Numbers */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="text-center">
                          <div className="text-xl font-bold text-solarized-base02">{progress.currentValue}</div>
                        </div>
                        <div className="text-solarized-base01">/</div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-solarized-base02">{target.targetValue}</div>
                        </div>
                        <div className="text-center ml-2">
                          <div className={`text-lg font-bold ${progress.statusColor}`}>
                            {Math.round(progress.percentage)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-2">
                      <div className="w-full bg-solarized-base1/20 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${progress.progressBarColor} relative`}
                          style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                        >
                          {/* Animated shine effect for completed targets */}
                          {progress.isCompleted && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}