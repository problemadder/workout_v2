import { Workout, Exercise } from '../types';

export function exportWorkoutsToCSV(workouts: Workout[], exercises: Exercise[]): void {
  // Create a map for quick exercise lookup
  const exerciseMap = new Map(exercises.map(ex => [ex.id, ex]));
  
  // Prepare CSV headers - removed "Set Notes"
  const headers = [
    'Date',
    'Exercise Name',
    'Exercise Category',
    'Set Number',
    'Reps',
    'Workout Notes'
  ];
  
  // Prepare CSV rows
  const rows: string[][] = [];
  
  // Sort workouts by date (oldest first for chronological export)
  const sortedWorkouts = [...workouts].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  sortedWorkouts.forEach(workout => {
    // Fix date formatting to avoid timezone issues
    const workoutDate = new Date(workout.date);
    const formattedDate = `${workoutDate.getFullYear()}-${String(workoutDate.getMonth() + 1).padStart(2, '0')}-${String(workoutDate.getDate()).padStart(2, '0')}`;
    const workoutNotes = workout.notes || '';
    
    if (workout.sets.length === 0) {
      // If no sets, still add a row for the workout
      rows.push([
        formattedDate,
        'No exercises',
        '',
        '0',
        '0',
        workoutNotes
      ]);
    } else {
      // Group sets by exercise to properly number them
      const exerciseSetCounts = new Map<string, number>();
      
      workout.sets.forEach((set) => {
        const exercise = exerciseMap.get(set.exerciseId);
        const exerciseName = exercise?.name || 'Unknown Exercise';
        const exerciseCategory = exercise?.category || '';
        
        // Track set number for this exercise
        const currentSetNumber = (exerciseSetCounts.get(set.exerciseId) || 0) + 1;
        exerciseSetCounts.set(set.exerciseId, currentSetNumber);
        
        rows.push([
          formattedDate,
          exerciseName,
          exerciseCategory,
          currentSetNumber.toString(),
          set.reps.toString(),
          workoutNotes
        ]);
      });
    }
  });
  
  // Convert to CSV format with proper UTF-8 encoding
  // Escape quotes and wrap fields in quotes to handle special characters
  const csvContent = [
    headers.map(header => `"${header.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  // Create and download the file with UTF-8 encoding (no BOM to avoid display issues)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fitness-workout-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function exportSummaryToCSV(workouts: Workout[], exercises: Exercise[]): void {
  // Create a map for quick exercise lookup
  const exerciseMap = new Map(exercises.map(ex => [ex.id, ex]));
  
  // Calculate summary statistics per workout
  const headers = [
    'Date',
    'Total Sets',
    'Total Reps',
    'Muscle Groups Trained',
    'Exercises Used',
    'Workout Notes'
  ];
  
  const rows: string[][] = [];
  
  // Sort workouts by date (oldest first)
  const sortedWorkouts = [...workouts].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  sortedWorkouts.forEach(workout => {
    // Fix date formatting to avoid timezone issues
    const workoutDate = new Date(workout.date);
    const formattedDate = `${workoutDate.getFullYear()}-${String(workoutDate.getMonth() + 1).padStart(2, '0')}-${String(workoutDate.getDate()).padStart(2, '0')}`;
    const totalSets = workout.sets.length;
    const totalReps = workout.sets.reduce((sum, set) => sum + set.reps, 0);
    
    // Get unique exercises and muscle groups used in this workout
    const uniqueExercises = [...new Set(workout.sets.map(set => set.exerciseId))]
      .map(id => exerciseMap.get(id)?.name || 'Unknown')
      .join('; ');
    
    const uniqueMuscleGroups = [...new Set(workout.sets.map(set => {
      const exercise = exerciseMap.get(set.exerciseId);
      return exercise?.category || 'unknown';
    }))].join('; ');
    
    rows.push([
      formattedDate,
      totalSets.toString(),
      totalReps.toString(),
      uniqueMuscleGroups,
      uniqueExercises,
      workout.notes || ''
    ]);
  });
  
  // Convert to CSV format with proper UTF-8 encoding
  const csvContent = [
    headers.map(header => `"${header.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  // Create and download the file with UTF-8 encoding
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fitness-workout-summary-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function exportExercisesToCSV(exercises: Exercise[]): void {
  // Prepare CSV headers
  const headers = [
    'Name',
    'Category',
    'Description',
    'Created Date'
  ];
  
  // Prepare CSV rows
  const rows: string[][] = [];
  
  // Sort exercises alphabetically by name
  const sortedExercises = [...exercises].sort((a, b) => a.name.localeCompare(b.name));
  
  sortedExercises.forEach(exercise => {
    // Fix date formatting to avoid timezone issues
    const createdDate = new Date(exercise.createdAt);
    const formattedDate = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-${String(createdDate.getDate()).padStart(2, '0')}`;
    
    rows.push([
      exercise.name,
      exercise.category,
      exercise.description || '',
      formattedDate
    ]);
  });
  
  // Convert to CSV format with proper UTF-8 encoding
  const csvContent = [
    headers.map(header => `"${header.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  // Create and download the file with UTF-8 encoding
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `fitness-exercises-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}