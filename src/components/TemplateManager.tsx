import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Play, BookOpen, X, Minus, Download, Upload } from 'lucide-react';
import { Exercise, WorkoutTemplate } from '../types';

interface TemplateManagerProps {
  templates: WorkoutTemplate[];
  exercises: Exercise[];
  onAddTemplate: (template: Omit<WorkoutTemplate, 'id' | 'createdAt'>) => void;
  onEditTemplate: (id: string, template: Omit<WorkoutTemplate, 'id' | 'createdAt'>) => void;
  onDeleteTemplate: (id: string) => void;
  onUseTemplate: (template: WorkoutTemplate) => void;
}

export function TemplateManager({ 
  templates, 
  exercises, 
  onAddTemplate, 
  onEditTemplate, 
  onDeleteTemplate, 
  onUseTemplate 
}: TemplateManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    exercises: [] as { exerciseId: string; sets: number }[]
  });

  // Sort exercises alphabetically by name
  const sortedExercises = [...exercises].sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.exercises.length === 0) return;

    if (editingId) {
      onEditTemplate(editingId, formData);
      setEditingId(null);
    } else {
      onAddTemplate(formData);
    }

    setFormData({ name: '', exercises: [] });
    setShowForm(false);
  };

  const handleEdit = (template: WorkoutTemplate) => {
    setFormData({
      name: template.name,
      exercises: template.exercises
    });
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', exercises: [] });
    setEditingId(null);
    setShowForm(false);
  };

  const addExerciseToTemplate = () => {
    if (sortedExercises.length === 0) return;
    setFormData({
      ...formData,
      exercises: [...formData.exercises, { exerciseId: sortedExercises[0].id, sets: 3 }]
    });
  };

  const updateTemplateExercise = (index: number, field: 'exerciseId' | 'sets', value: string | number) => {
    const newExercises = [...formData.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setFormData({ ...formData, exercises: newExercises });
  };

  const removeTemplateExercise = (index: number) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index)
    });
  };

  const incrementSets = (index: number) => {
    updateTemplateExercise(index, 'sets', Math.min(formData.exercises[index].sets + 1, 10));
  };

  const decrementSets = (index: number) => {
    updateTemplateExercise(index, 'sets', Math.max(formData.exercises[index].sets - 1, 1));
  };

  const exportTemplates = () => {
    if (templates.length === 0) {
      alert('No templates to export');
      return;
    }

    // Create CSV content
    const headers = ['name', 'exerciseName', 'exerciseCategory', 'sets'];
    const rows: string[][] = [];

    templates.forEach(template => {
      template.exercises.forEach(templateExercise => {
        const exercise = exercises.find(ex => ex.id === templateExercise.exerciseId);
        rows.push([
          template.name,
          exercise?.name || 'Unknown Exercise',
          exercise?.category || '',
          templateExercise.sets.toString()
        ]);
      });
    });

    const csvContent = [
      headers.map(header => `"${header.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `workout-templates-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportTemplates = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    try {
      const content = await file.text();
      const lines = content.trim().split('\n');
      
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').toLowerCase().trim());
      
      // Find header indices
      const nameIndex = headers.findIndex(h => h === 'name' || h.includes('name'));
      const exerciseNameIndex = headers.findIndex(h => 
        h === 'exercisename' || h === 'exercise_name' || h === 'exercise' || h.includes('exercise')
      );
      const setsIndex = headers.findIndex(h => h === 'sets' || h.includes('sets'));

      if (nameIndex === -1 || exerciseNameIndex === -1 || setsIndex === -1) {
        throw new Error('CSV must have "name", "exerciseName", and "sets" columns');
      }

      // Parse templates
      const templateMap = new Map<string, { exerciseId: string; sets: number }[]>();
      const exerciseMap = new Map(exercises.map(ex => [ex.name.toLowerCase(), ex]));

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        
        const templateName = values[nameIndex];
        const exerciseName = values[exerciseNameIndex];
        const sets = parseInt(values[setsIndex]);

        if (!templateName || !exerciseName || isNaN(sets)) continue;

        const exercise = exerciseMap.get(exerciseName.toLowerCase());
        if (!exercise) {
          console.warn(`Exercise "${exerciseName}" not found, skipping`);
          continue;
        }

        if (!templateMap.has(templateName)) {
          templateMap.set(templateName, []);
        }

        templateMap.get(templateName)!.push({
          exerciseId: exercise.id,
          sets
        });
      }

      // Create templates
      let importedCount = 0;
      templateMap.forEach((templateExercises, templateName) => {
        // Check if template already exists
        onAddTemplate({
          name: templateName,
          exercises: templateExercises
        });
        importedCount++;
      });

      if (importedCount > 0) {
        alert(`Successfully imported ${importedCount} templates`);
      } else {
        alert('No new templates were imported');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`Failed to import templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  const downloadTemplateCSVTemplate = () => {
    const headers = ['name', 'exerciseName', 'exerciseCategory', 'sets'];
    const examples = [
      ['Morning Routine', 'Push-ups', 'arms', '3'],
      ['Morning Routine', 'Squats', 'legs', '3'],
      ['Morning Routine', 'Plank', 'abs', '2'],
      ['Evening Workout', 'Pull-ups', 'back', '3'],
      ['Evening Workout', 'Lunges', 'legs', '3']
    ];
    
    const csvContent = [
      headers.join(','),
      ...examples.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'templates-template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Group sorted exercises by category for the dropdown
  const categories = [
    { value: 'abs', label: 'Abs' },
    { value: 'legs', label: 'Legs' },
    { value: 'arms', label: 'Arms' },
    { value: 'back', label: 'Back' },
    { value: 'shoulders', label: 'Shoulders' },
    { value: 'chest', label: 'Chest' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'full-body', label: 'Full Body' }
  ];

  return (
    <div className="p-6 pb-24 space-y-6 bg-solarized-base3 min-h-screen">
      {/* Header with Import/Export */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-solarized-base02 mb-4">Workout Templates</h2>
          
          {/* Mobile-friendly button layout */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={downloadTemplateCSVTemplate}
              className="flex items-center justify-center gap-1 px-2 py-2 bg-solarized-base1/10 text-solarized-base01 rounded-lg hover:bg-solarized-base1/20 transition-colors text-xs border border-solarized-base1/20"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Template</span>
              <span className="sm:hidden">CSV</span>
            </button>
            <label className="flex items-center justify-center gap-1 px-2 py-2 bg-solarized-green text-solarized-base3 rounded-lg hover:bg-solarized-green/90 transition-colors cursor-pointer text-xs">
              <Upload size={14} />
              <span>Import</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportTemplates}
                className="hidden"
              />
            </label>
            <button
              onClick={exportTemplates}
              disabled={templates.length === 0}
              className="flex items-center justify-center gap-1 px-2 py-2 bg-solarized-blue text-solarized-base3 rounded-lg hover:bg-solarized-blue/90 transition-colors disabled:bg-solarized-base1 disabled:cursor-not-allowed text-xs"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Create Template Button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-solarized-violet text-solarized-base3 py-3 px-4 rounded-lg font-medium hover:bg-solarized-violet/90 transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          <Plus size={20} />
          Create New Template
        </button>
      </div>

      {/* Template Form */}
      {showForm && (
        <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
          <h3 className="text-lg font-semibold mb-4 text-solarized-base02">
            {editingId ? 'Edit Template' : 'Create New Template'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-solarized-base01 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-violet focus:border-transparent bg-solarized-base3 text-solarized-base02"
                placeholder="e.g., Morning Abs Routine"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-solarized-base01">
                  Exercises
                </label>
                <button
                  type="button"
                  onClick={addExerciseToTemplate}
                  className="bg-solarized-violet text-solarized-base3 py-2 px-4 rounded-lg font-medium hover:bg-solarized-violet/90 transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Add Exercise</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
              
              {formData.exercises.length === 0 ? (
                <p className="text-solarized-base01 text-sm py-4 text-center">
                  No exercises added yet. Click "Add Exercise" to start building your template.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.exercises.map((templateExercise, index) => (
                    <div key={index} className="bg-solarized-base1/10 rounded-lg p-4 border border-solarized-base1/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-solarized-base01 bg-solarized-base1/20 px-2 py-1 rounded">
                          Exercise {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTemplateExercise(index)}
                          className="p-1 text-solarized-red hover:bg-solarized-red/10 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-solarized-base01 mb-1">
                            Exercise
                          </label>
                          <select
                            value={templateExercise.exerciseId}
                            onChange={(e) => updateTemplateExercise(index, 'exerciseId', e.target.value)}
                            className="w-full p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-violet focus:border-transparent bg-solarized-base3 text-solarized-base02"
                          >
                            {categories.sort((a, b) => a.label.localeCompare(b.label)).map(category => {
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
                        
                        <div>
                          <label className="block text-sm font-medium text-solarized-base01 mb-1">
                            Number of Sets
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => decrementSets(index)}
                              className="p-2 bg-solarized-base1/20 text-solarized-base01 rounded-lg hover:bg-solarized-base1/30 transition-colors border border-solarized-base1/30"
                            >
                              <Minus size={16} />
                            </button>
                            <input
                              type="number"
                              value={templateExercise.sets}
                              onChange={(e) => updateTemplateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                              className="flex-1 p-3 border border-solarized-base1 rounded-lg focus:ring-2 focus:ring-solarized-violet focus:border-transparent bg-solarized-base3 text-solarized-base02 text-center"
                              min="1"
                              max="10"
                            />
                            <button
                              type="button"
                              onClick={() => incrementSets(index)}
                              className="p-2 bg-solarized-base1/20 text-solarized-base01 rounded-lg hover:bg-solarized-base1/30 transition-colors border border-solarized-base1/30"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={formData.exercises.length === 0}
                className="flex-1 bg-solarized-violet text-solarized-base3 py-3 px-4 rounded-lg font-medium hover:bg-solarized-violet/90 transition-colors disabled:bg-solarized-base1 disabled:cursor-not-allowed shadow-md"
              >
                {editingId ? 'Update Template' : 'Create Template'}
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

      {/* Templates List */}
      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-solarized-base1 mb-4" />
            <p className="text-solarized-base01 mb-4">No templates yet</p>
            <p className="text-sm text-solarized-base1">Create your first workout template to save time</p>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-solarized-base2 rounded-xl p-4 shadow-lg border border-solarized-base1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-solarized-base02 mb-2">{template.name}</h3>
                  <div className="space-y-1">
                    {template.exercises.map((templateExercise, index) => {
                      const exercise = sortedExercises.find(e => e.id === templateExercise.exerciseId);
                      return (
                        <div key={index} className="text-sm text-solarized-base01">
                          {exercise?.name || 'Unknown Exercise'} - {templateExercise.sets} sets
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => onUseTemplate(template)}
                    className="p-2 text-solarized-green hover:bg-solarized-green/10 rounded-lg transition-colors"
                    title="Use this template"
                  >
                    <Play size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-solarized-base01 hover:text-solarized-blue hover:bg-solarized-blue/10 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteTemplate(template.id)}
                    className="p-2 text-solarized-base01 hover:text-solarized-red hover:bg-solarized-red/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}