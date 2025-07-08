import { Exercise, Workout, WorkoutSet } from '../types';

export interface ExerciseCSVRow {
  name: string;
  description?: string;
  category: Exercise['category'];
}

export interface WorkoutCSVRow {
  date: string;
  exerciseName: string;
  exerciseCategory?: Exercise['category'];
  setNumber: string;
  reps: string;
  setNotes?: string;
  workoutNotes?: string;
}

// Improved CSV parsing function
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  return result.map(field => field.replace(/^"(.*)"$/, '$1')); // Remove surrounding quotes
}

export function parseExercisesCSV(csvContent: string): ExerciseCSVRow[] {
  console.log('Starting CSV parse with content:', csvContent.substring(0, 200) + '...');
  
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');
  
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const exercises: ExerciseCSVRow[] = [];
  
  console.log('CSV Headers found:', headers);
  
  // Find header indices - be more flexible with header matching
  const nameIndex = headers.findIndex(h => 
    h === 'name' || 
    h === 'exercise' || 
    h === 'exercise_name' || 
    h.includes('name')
  );
  
  const descriptionIndex = headers.findIndex(h => 
    h === 'description' || 
    h === 'desc' || 
    h.includes('description')
  );
  
  const categoryIndex = headers.findIndex(h => 
    h === 'category' || 
    h === 'type' || 
    h === 'muscle_group' || 
    h.includes('category')
  );
  
  console.log('Header indices:', { nameIndex, descriptionIndex, categoryIndex });
  
  if (nameIndex === -1) {
    throw new Error(`CSV must have a "name" column. Found headers: ${headers.join(', ')}`);
  }
  if (categoryIndex === -1) {
    throw new Error(`CSV must have a "category" column. Found headers: ${headers.join(', ')}`);
  }
  
  const validCategories: Exercise['category'][] = ['abs', 'legs', 'arms', 'back', 'shoulders', 'chest', 'cardio', 'full-body'];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = parseCSVLine(line);
    console.log(`Row ${i}:`, values);
    
    const name = values[nameIndex]?.trim();
    if (!name) {
      console.log(`Skipping row ${i}: no name`);
      continue;
    }
    
    const categoryRaw = values[categoryIndex]?.trim().toLowerCase();
    console.log(`Row ${i} category raw:`, categoryRaw);
    
    // Map common category variations
    let category: Exercise['category'];
    switch (categoryRaw) {
      case 'abs':
      case 'abdominals':
      case 'core':
      case 'stomach':
        category = 'abs';
        break;
      case 'legs':
      case 'leg':
      case 'lower body':
      case 'quads':
      case 'hamstrings':
      case 'calves':
        category = 'legs';
        break;
      case 'arms':
      case 'arm':
      case 'biceps':
      case 'triceps':
      case 'forearms':
        category = 'arms';
        break;
      case 'back':
      case 'lats':
      case 'latissimus':
      case 'rhomboids':
      case 'traps':
        category = 'back';
        break;
      case 'shoulders':
      case 'shoulder':
      case 'delts':
      case 'deltoids':
        category = 'shoulders';
        break;
      case 'chest':
      case 'pecs':
      case 'pectorals':
        category = 'chest';
        break;
      case 'cardio':
      case 'cardiovascular':
      case 'aerobic':
      case 'conditioning':
        category = 'cardio';
        break;
      case 'full-body':
      case 'full body':
      case 'fullbody':
      case 'compound':
      case 'total body':
        category = 'full-body';
        break;
      default:
        console.warn(`Unknown category "${categoryRaw}" on line ${i + 1}, defaulting to 'full-body'`);
        category = 'full-body';
    }
    
    const description = descriptionIndex >= 0 ? values[descriptionIndex]?.trim() : '';
    
    console.log(`Adding exercise: ${name}, category: ${category}, description: ${description}`);
    
    exercises.push({
      name,
      description: description || undefined,
      category
    });
  }
  
  console.log('Final parsed exercises:', exercises);
  return exercises;
}

export function parseWorkoutsCSV(csvContent: string, exercises: Exercise[]): { workouts: Workout[], newExercises: Exercise[] } {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');
  
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  
  // Find header indices
  const dateIndex = headers.findIndex(h => h === 'date' || h.includes('date'));
  const exerciseNameIndex = headers.findIndex(h => 
    h === 'exercisename' || 
    h === 'exercise_name' || 
    h === 'exercise' || 
    (h.includes('exercise') && h.includes('name'))
  );
  const exerciseCategoryIndex = headers.findIndex(h => 
    h === 'exercisecategory' || 
    h === 'exercise_category' || 
    (h.includes('exercise') && h.includes('category'))
  );
  const setNumberIndex = headers.findIndex(h => 
    h === 'setnumber' || 
    h === 'set_number' || 
    h === 'set' || 
    (h.includes('set') && h.includes('number'))
  );
  const repsIndex = headers.findIndex(h => h === 'reps' || h.includes('reps') || h === 'repetitions');
  const setNotesIndex = headers.findIndex(h => 
    h === 'setnotes' || 
    h === 'set_notes' || 
    (h.includes('set') && h.includes('notes'))
  );
  const workoutNotesIndex = headers.findIndex(h => 
    h === 'workoutnotes' || 
    h === 'workout_notes' || 
    (h.includes('workout') && h.includes('notes'))
  );
  
  if (dateIndex === -1) throw new Error('CSV must have a "date" column');
  if (exerciseNameIndex === -1) throw new Error('CSV must have an "exerciseName" column');
  if (repsIndex === -1) throw new Error('CSV must have a "reps" column');
  if (setNumberIndex === -1) throw new Error('CSV must have a "setNumber" column for proper set position tracking');
  
  const workoutMap = new Map<string, { 
    sets: Array<{ exerciseId: string; reps: number; notes?: string; setNumber: number; exerciseName: string }>, 
    notes?: string 
  }>();
  const exerciseMap = new Map(exercises.map(ex => [ex.name.toLowerCase(), ex]));
  const newExercises: Exercise[] = [];
  const validCategories: Exercise['category'][] = ['abs', 'legs', 'arms', 'back', 'shoulders', 'chest', 'cardio', 'full-body'];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = parseCSVLine(line);
    
    const dateStr = values[dateIndex]?.trim();
    const exerciseName = values[exerciseNameIndex]?.trim();
    const repsStr = values[repsIndex]?.trim();
    const setNumberStr = values[setNumberIndex]?.trim();
    
    if (!dateStr || !exerciseName || !repsStr || !setNumberStr) continue; // Skip incomplete rows
    
    // Parse date
    let date: Date;
    try {
      date = new Date(dateStr);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
    } catch {
      throw new Error(`Invalid date "${dateStr}" on line ${i + 1}`);
    }
    
    // Parse reps
    const reps = parseInt(repsStr);
    if (isNaN(reps) || reps < 0) {
      throw new Error(`Invalid reps "${repsStr}" on line ${i + 1}`);
    }
    
    // Parse set number
    const setNumber = parseInt(setNumberStr);
    if (isNaN(setNumber) || setNumber < 1) {
      throw new Error(`Invalid set number "${setNumberStr}" on line ${i + 1}. Set number must be 1 or greater.`);
    }
    
    // Find or create exercise
    let exercise = exerciseMap.get(exerciseName.toLowerCase());
    if (!exercise) {
      // Create new exercise
      let category: Exercise['category'] = 'full-body'; // default
      
      if (exerciseCategoryIndex >= 0) {
        const categoryRaw = values[exerciseCategoryIndex]?.trim().toLowerCase();
        if (validCategories.includes(categoryRaw as Exercise['category'])) {
          category = categoryRaw as Exercise['category'];
        }
      }
      
      exercise = {
        id: crypto.randomUUID(),
        name: exerciseName,
        category,
        createdAt: new Date()
      };
      
      exerciseMap.set(exerciseName.toLowerCase(), exercise);
      newExercises.push(exercise);
    }
    
    // Create workout set with set number tracking
    const set = {
      exerciseId: exercise.id,
      reps,
      notes: setNotesIndex >= 0 ? values[setNotesIndex]?.trim() : undefined,
      setNumber,
      exerciseName
    };
    
    // Group by date
    const dateKey = date.toDateString();
    if (!workoutMap.has(dateKey)) {
      workoutMap.set(dateKey, { sets: [], notes: undefined });
    }
    
    const workout = workoutMap.get(dateKey)!;
    workout.sets.push(set);
    
    // Update workout notes if provided
    if (workoutNotesIndex >= 0) {
      const workoutNotes = values[workoutNotesIndex]?.trim();
      if (workoutNotes && !workout.notes) {
        workout.notes = workoutNotes;
      }
    }
  }
  
  // Convert to workout objects and properly order sets
  const workouts: Workout[] = Array.from(workoutMap.entries()).map(([dateStr, data]) => {
    // Group sets by exercise and sort by set number within each exercise
    const exerciseGroups = new Map<string, typeof data.sets>();
    
    data.sets.forEach(set => {
      if (!exerciseGroups.has(set.exerciseName)) {
        exerciseGroups.set(set.exerciseName, []);
      }
      exerciseGroups.get(set.exerciseName)!.push(set);
    });
    
    // Sort sets within each exercise by set number, then flatten
    const orderedSets: Omit<WorkoutSet, 'id'>[] = [];
    Array.from(exerciseGroups.values()).forEach(exerciseSets => {
      exerciseSets.sort((a, b) => a.setNumber - b.setNumber);
      exerciseSets.forEach(set => {
        orderedSets.push({
          exerciseId: set.exerciseId,
          reps: set.reps,
          notes: set.notes
        });
      });
    });
    
    return {
      id: crypto.randomUUID(),
      date: new Date(dateStr),
      sets: orderedSets.map(set => ({ ...set, id: crypto.randomUUID() })),
      notes: data.notes
    };
  });
  
  return { workouts, newExercises };
}

export function generateExerciseCSVTemplate(): string {
  const headers = ['name', 'category', 'description'];
  const examples = [
    ['Push-ups', 'arms', 'Standard push-ups for chest and arms'],
    ['Squats', 'legs', 'Bodyweight squats for legs'],
    ['Plank', 'abs', 'Core stability exercise'],
    ['Pull-ups', 'back', 'Upper body pulling exercise']
  ];
  
  const csvContent = [
    headers.join(','),
    ...examples.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

export function generateWorkoutCSVTemplate(): string {
  const headers = ['date', 'exerciseName', 'exerciseCategory', 'setNumber', 'reps', 'setNotes', 'workoutNotes'];
  const examples = [
    ['2024-01-15', 'Push-ups', 'arms', '1', '15', 'Felt strong', 'Great morning workout'],
    ['2024-01-15', 'Push-ups', 'arms', '2', '12', 'Getting tired', 'Great morning workout'],
    ['2024-01-15', 'Push-ups', 'arms', '3', '10', 'Final set', 'Great morning workout'],
    ['2024-01-15', 'Squats', 'legs', '1', '20', 'Good form', 'Great morning workout'],
    ['2024-01-15', 'Squats', 'legs', '2', '18', 'Legs burning', 'Great morning workout'],
    ['2024-01-16', 'Plank', 'abs', '1', '30', 'Held for 30 seconds', 'Quick abs session'],
    ['2024-01-16', 'Plank', 'abs', '2', '25', 'Shorter hold', 'Quick abs session']
  ];
  
  const csvContent = [
    headers.join(','),
    ...examples.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n');
  
  return csvContent;
}