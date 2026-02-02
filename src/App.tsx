import React, { useState, useEffect, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ExerciseList } from './components/ExerciseList';
import { WorkoutLogger } from './components/WorkoutLogger';
import { TemplateManager } from './components/TemplateManager';
import { Stats } from './components/Stats';
import { ImportExport } from './components/ImportExport';
import { Targets } from './components/Targets';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Exercise, Workout, WorkoutStats, WorkoutTemplate, WorkoutTarget } from './types';
import { defaultExercises } from './data/defaultExercises';
import { isToday } from './utils/dateUtils';
import { saveDraftWorkout, loadDraftWorkout, clearDraftWorkout } from './utils/draftWorkoutUtils';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exercises, setExercises] = useLocalStorage<Exercise[]>('abs-exercises', []);
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>('abs-workouts', []);
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>('abs-templates', []);
  const [targets, setTargets] = useLocalStorage<WorkoutTarget[]>('abs-targets', []);
  const [pendingWorkout, setPendingWorkout] = useState<{
    sets: Array<{ exerciseId: string; reps: number }>;
    notes: string;
  } | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<WorkoutTemplate | null>(null);
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize default exercises if none exist
  useEffect(() => {
    if (exercises.length === 0 && defaultExercises.length > 0) {
      const initialExercises: Exercise[] = defaultExercises.map(exercise => ({
        ...exercise,
        id: crypto.randomUUID(),
        createdAt: new Date()
      }));
      setExercises(initialExercises);
    }
  }, [exercises.length, setExercises]);

  // Restore draft workout on app load
  useEffect(() => {
    const draft = loadDraftWorkout();
    if (draft) {
      setPendingWorkout({
        sets: draft.sets.map((set) => {
          const { id, ...rest } = set;
          return rest;
        }),
        notes: draft.notes
      });
    }
  }, []);

  // Cleanup draft save timeout on unmount
  useEffect(() => {
    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, []);

  // Calculate stats
  const calculateStats = (): WorkoutStats => {
    const totalWorkouts = workouts.length;
    const totalSets = workouts.reduce((total, workout) => total + workout.sets.length, 0);
    const totalReps = workouts.reduce((total, workout) => 
      total + workout.sets.reduce((setTotal, set) => setTotal + set.reps, 0), 0
    );

    // Calculate current streak
    let currentStreak = 0;
    const sortedWorkouts = [...workouts].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sortedWorkouts.length > 0) {
      const today = new Date();
      let checkDate = new Date(today);
      
      // If there's a workout today, start from today, otherwise start from yesterday
      if (!sortedWorkouts.some(w => isToday(new Date(w.date)))) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      for (let i = 0; i < 365; i++) { // Max check 365 days
        const hasWorkout = sortedWorkouts.some(w => 
          new Date(w.date).toDateString() === checkDate.toDateString()
        );
        
        if (hasWorkout) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const allDates = sortedWorkouts.map(w => new Date(w.date).toDateString());
    const uniqueDates = [...new Set(allDates)].sort();

    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const daysDiff = Math.abs(currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      totalWorkouts,
      totalSets,
      totalReps,
      currentStreak,
      longestStreak
    };
  };

  const stats = calculateStats();
  const todaysWorkout = workouts.find(w => isToday(new Date(w.date)));

  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workouts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleAddExercise = (exerciseData: Omit<Exercise, 'id' | 'createdAt'>) => {
    console.log('App.handleAddExercise called with:', exerciseData);
    
    const newExercise: Exercise = {
      ...exerciseData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    
    console.log('Creating new exercise:', newExercise);
    
    const updatedExercises = [...exercises, newExercise];
    console.log('Updated exercises array:', updatedExercises);
    
    setExercises(updatedExercises);
    console.log('Exercise added successfully');
  };

  const handleEditExercise = (id: string, exerciseData: Omit<Exercise, 'id' | 'createdAt'>) => {
    console.log('App.handleEditExercise called with:', id, exerciseData);
    
    const updatedExercises = exercises.map(exercise => 
      exercise.id === id 
        ? { ...exercise, ...exerciseData }
        : exercise
    );
    
    setExercises(updatedExercises);
    console.log('Exercise edited successfully');
  };

  const handleDeleteExercise = (id: string) => {
    setExercises(exercises.filter(exercise => exercise.id !== id));
    // Also remove any workout sets that reference this exercise
    setWorkouts(workouts.map(workout => ({
      ...workout,
      sets: workout.sets.filter(set => set.exerciseId !== id)
    })).filter(workout => workout.sets.length > 0));
    // Also remove from templates
    setTemplates(templates.map(template => ({
      ...template,
      exercises: template.exercises.filter(ex => ex.id !== id)
    })).filter(template => template.exercises.length > 0));
  };

  const handleAddTemplate = (templateData: Omit<WorkoutTemplate, 'id' | 'createdAt'> | WorkoutTemplate[]) => {
    if (Array.isArray(templateData)) {
      // Batch import
      console.log(`Batch importing ${templateData.length} templates`);
      setTemplates(prevTemplates => [...prevTemplates, ...templateData]);
      console.log('Batch templates added successfully');
    } else {
      // Single template
      const newTemplate: WorkoutTemplate = {
        ...templateData,
        id: crypto.randomUUID(),
        createdAt: new Date()
      };
      
      console.log('Creating new template:', newTemplate);
      setTemplates(prevTemplates => [...prevTemplates, newTemplate]);
      console.log('Template added successfully');
    }
  };

  const handleEditTemplate = (id: string, templateData: Omit<WorkoutTemplate, 'id' | 'createdAt'>) => {
    setTemplates(templates.map(template => 
      template.id === id 
        ? { ...template, ...templateData }
        : template
    ));
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(template => template.id !== id));
  };

  const handleUseTemplate = (template: WorkoutTemplate) => {
    setPendingTemplate(template);
    setActiveTab('workout');
  };

  const handleAddTarget = (targetData: Omit<WorkoutTarget, 'id' | 'createdAt'>) => {
    const newTarget: WorkoutTarget = {
      ...targetData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    setTargets([...targets, newTarget]);
  };

  const handleEditTarget = (id: string, targetData: Omit<WorkoutTarget, 'id' | 'createdAt'>) => {
    setTargets(targets.map(target => 
      target.id === id 
        ? { ...target, ...targetData }
        : target
    ));
  };

  const handleDeleteTarget = (id: string) => {
    setTargets(targets.filter(target => target.id !== id));
  };

  const handleSaveWorkout = (workoutData: Omit<Workout, 'id'>) => {
    const newWorkout: Workout = {
      ...workoutData,
      id: crypto.randomUUID()
    };
    setWorkouts([...workouts, newWorkout]);
    setActiveTab('dashboard');
    clearDraftWorkout();
  };

  const handleUpdateWorkout = (id: string, workoutData: Omit<Workout, 'id'>) => {
    setWorkouts(workouts.map(workout =>
      workout.id === id
        ? { ...workout, ...workoutData }
        : workout
    ));
    setActiveTab('dashboard');
    clearDraftWorkout();
  };

  const handleStartWorkout = () => {
    setActiveTab('workout');
  };

  const handleTabChange = (newTab: string) => {
    // If switching away from workout tab and there's pending workout data, auto-save it
    if (activeTab === 'workout' && newTab !== 'workout' && pendingWorkout) {
      if (pendingWorkout.sets.length > 0) {
        const workout: Omit<Workout, 'id'> = {
          date: new Date(),
          sets: pendingWorkout.sets.map(set => ({
            ...set,
            id: crypto.randomUUID()
          })),
          notes: pendingWorkout.notes.trim() || undefined
        };

        const todaysWorkout = workouts.find(w => isToday(new Date(w.date)));
        if (todaysWorkout) {
          handleUpdateWorkout(todaysWorkout.id, workout);
        } else {
          handleSaveWorkout(workout);
        }

        // Clear pending workout after saving
        setPendingWorkout(null);
        // Draft will be cleared by handleSaveWorkout/handleUpdateWorkout
      } else {
        // Clear draft if switching away with empty workout
        clearDraftWorkout();
      }
    }

    setActiveTab(newTab);
  };

  const handleWorkoutDataChange = (sets: Array<{ exerciseId: string; reps: number }>, notes: string) => {
    setPendingWorkout({ sets, notes });

    // Debounced auto-save to localStorage
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }

    draftSaveTimeoutRef.current = setTimeout(() => {
      saveDraftWorkout(sets, notes);
    }, 400); // 400ms debounce
  };

  const handleImportExercises = (newExercises: Exercise[]) => {
    console.log('App.handleImportExercises called with:', newExercises);
    const updatedExercises = [...exercises, ...newExercises];
    setExercises(updatedExercises);
    console.log('Exercises imported successfully, new total:', updatedExercises.length);
  };

  const handleImportWorkouts = (newWorkouts: Workout[], newExercises: Exercise[]) => {
    // Add new exercises first
    if (newExercises.length > 0) {
      setExercises([...exercises, ...newExercises]);
    }
    
    // Merge workouts, avoiding duplicates by date
    const existingDates = new Set(workouts.map(w => new Date(w.date).toDateString()));
    const uniqueNewWorkouts = newWorkouts.filter(w => 
      !existingDates.has(new Date(w.date).toDateString())
    );
    
    setWorkouts([...workouts, ...uniqueNewWorkouts]);
  };

  const handleImportTargets = (newTargets: WorkoutTarget[]) => {
    // Merge targets, avoiding duplicates by name
    const existingNames = new Set(targets.map(t => t.name.toLowerCase()));
    const uniqueNewTargets = newTargets.filter(t => 
      !existingNames.has(t.name.toLowerCase())
    );
    
    setTargets([...targets, ...uniqueNewTargets]);
  };

  return (
    <div className="min-h-screen bg-solarized-base3">
      <main className="relative">
        {activeTab === 'dashboard' && (
          <Dashboard 
            workouts={sortedWorkouts}
            stats={stats}
            onStartWorkout={handleStartWorkout}
          />
        )}
        
        {activeTab === 'exercises' && (
          <ExerciseList
            exercises={exercises}
            onAddExercise={handleAddExercise}
            onEditExercise={handleEditExercise}
            onDeleteExercise={handleDeleteExercise}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateManager
            templates={templates}
            exercises={exercises}
            onAddTemplate={handleAddTemplate}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onUseTemplate={handleUseTemplate}
          />
        )}
        
        {activeTab === 'workout' && (
          <WorkoutLogger
            exercises={exercises}
            todaysWorkout={todaysWorkout || null}
            workouts={workouts}
            templates={templates}
            pendingTemplate={pendingTemplate}
            onSaveWorkout={handleSaveWorkout}
            onUpdateWorkout={handleUpdateWorkout}
            onAddTemplate={handleAddTemplate}
            onWorkoutDataChange={handleWorkoutDataChange}
            onTemplateClear={() => setPendingTemplate(null)}
          />
        )}
        
        {activeTab === 'stats' && (
          <Stats
            workouts={sortedWorkouts}
            exercises={exercises}
            stats={stats}
          />
        )}

        {activeTab === 'targets' && (
          <Targets
            targets={targets}
            exercises={exercises}
            workouts={workouts}
            onAddTarget={handleAddTarget}
            onEditTarget={handleEditTarget}
            onDeleteTarget={handleDeleteTarget}
          />
        )}

        {activeTab === 'import' && (
          <ImportExport
            exercises={exercises}
            workouts={workouts}
            targets={targets}
            onImportExercises={handleImportExercises}
            onImportWorkouts={handleImportWorkouts}
            onImportTargets={handleImportTargets}
          />
        )}
      </main>

      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default App;