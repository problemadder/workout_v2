import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X, RotateCcw, Dumbbell } from 'lucide-react';
import { Exercise, Workout } from '../types';
import { parseExercisesCSV, parseWorkoutsCSV, generateExerciseCSVTemplate, generateWorkoutCSVTemplate } from '../utils/csvImport';
import { exportWorkoutsToCSV, exportSummaryToCSV, exportExercisesToCSV } from '../utils/csvExport';

interface ImportExportProps {
  exercises: Exercise[];
  workouts: Workout[];
  onImportExercises: (exercises: Exercise[]) => void;
  onImportWorkouts: (workouts: Workout[], newExercises: Exercise[]) => void;
}

export function ImportExport({ exercises, workouts, onImportExercises, onImportWorkouts }: ImportExportProps) {
  const [importType, setImportType] = useState<'exercises' | 'workouts' | null>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'exercises' | 'workouts') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setImportStatus({
        type: 'error',
        message: 'Please select a CSV file'
      });
      return;
    }

    setIsProcessing(true);
    setImportStatus(null);
    setImportType(type);

    try {
      const content = await file.text();
      console.log('File content:', content.substring(0, 500) + '...');
      
      if (type === 'exercises') {
        const parsedExercises = parseExercisesCSV(content);
        console.log('Parsed exercises:', parsedExercises);
        
        if (parsedExercises.length === 0) {
          throw new Error('No valid exercises found in CSV');
        }

        // Convert to Exercise objects
        const newExercises: Exercise[] = parsedExercises.map(ex => ({
          id: crypto.randomUUID(),
          name: ex.name,
          description: ex.description,
          category: ex.category,
          createdAt: new Date()
        }));

        console.log('Calling onImportExercises with:', newExercises);
        onImportExercises(newExercises);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${newExercises.length} exercises`
        });
      } else {
        const { workouts: parsedWorkouts, newExercises } = parseWorkoutsCSV(content, exercises);
        
        if (parsedWorkouts.length === 0) {
          throw new Error('No valid workouts found in CSV');
        }

        onImportWorkouts(parsedWorkouts, newExercises);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${parsedWorkouts.length} workouts${newExercises.length > 0 ? ` and created ${newExercises.length} new exercises` : ''}`
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to import CSV'
      });
    } finally {
      setIsProcessing(false);
      setImportType(null);
      // Reset file input
      event.target.value = '';
    }
  };

  const downloadTemplate = (type: 'exercises' | 'workouts') => {
    const content = type === 'exercises' ? generateExerciseCSVTemplate() : generateWorkoutCSVTemplate();
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${type}-template.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportDetailed = () => {
    if (workouts.length === 0) {
      setImportStatus({
        type: 'error',
        message: 'No workout data to export'
      });
      return;
    }
    exportWorkoutsToCSV(workouts, exercises);
    setImportStatus({
      type: 'success',
      message: 'Workout data exported successfully'
    });
  };

  const handleExportSummary = () => {
    if (workouts.length === 0) {
      setImportStatus({
        type: 'error',
        message: 'No workout data to export'
      });
      return;
    }
    exportSummaryToCSV(workouts, exercises);
    setImportStatus({
      type: 'success',
      message: 'Summary data exported successfully'
    });
  };

  const handleExportExercises = () => {
    if (exercises.length === 0) {
      setImportStatus({
        type: 'error',
        message: 'No exercises to export'
      });
      return;
    }
    exportExercisesToCSV(exercises);
    setImportStatus({
      type: 'success',
      message: 'Exercises exported successfully'
    });
  };

  const handleResetApp = () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }

    // Clear all localStorage data
    localStorage.removeItem('abs-exercises');
    localStorage.removeItem('abs-workouts');
    localStorage.removeItem('abs-templates');
    
    // Reload the page to reset the app
    window.location.reload();
  };

  return (
    <div className="p-6 pb-24 space-y-6 bg-solarized-base3 min-h-screen">
      {/* Status Message */}
      {importStatus && (
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${
          importStatus.type === 'success' 
            ? 'bg-solarized-green/10 border-solarized-green/20 text-solarized-green'
            : importStatus.type === 'error'
            ? 'bg-solarized-red/10 border-solarized-red/20 text-solarized-red'
            : 'bg-solarized-blue/10 border-solarized-blue/20 text-solarized-blue'
        }`}>
          {importStatus.type === 'success' && <CheckCircle size={20} />}
          {importStatus.type === 'error' && <AlertCircle size={20} />}
          {importStatus.type === 'info' && <AlertCircle size={20} />}
          <span className="flex-1">{importStatus.message}</span>
          <button
            onClick={() => setImportStatus(null)}
            className="p-1 hover:bg-black/10 rounded"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Import Section */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Upload size={20} className="text-solarized-blue" />
          Import Data
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Import Exercises */}
          <div className="space-y-3">
            <h4 className="font-medium text-solarized-base02">Import Exercises</h4>
            <p className="text-sm text-solarized-base01">
              Upload a CSV file with your exercises. Required columns: name, category. Optional: description.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => downloadTemplate('exercises')}
                className="flex items-center gap-2 px-3 py-2 bg-solarized-base1/10 text-solarized-base01 rounded-lg hover:bg-solarized-base1/20 transition-colors text-sm border border-solarized-base1/20"
              >
                <Download size={16} />
                Template
              </button>
              
              <label className="flex items-center gap-2 px-4 py-2 bg-solarized-blue text-solarized-base3 rounded-lg hover:bg-solarized-blue/90 transition-colors cursor-pointer text-sm">
                <Upload size={16} />
                {isProcessing && importType === 'exercises' ? 'Processing...' : 'Import CSV'}
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, 'exercises')}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>
            </div>
          </div>

          {/* Import Workouts */}
          <div className="space-y-3">
            <h4 className="font-medium text-solarized-base02">Import Workout History</h4>
            <p className="text-sm text-solarized-base01">
              Upload a CSV file with your workout history. Required columns: date, exerciseName, setNumber, reps.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => downloadTemplate('workouts')}
                className="flex items-center gap-2 px-3 py-2 bg-solarized-base1/10 text-solarized-base01 rounded-lg hover:bg-solarized-base1/20 transition-colors text-sm border border-solarized-base1/20"
              >
                <Download size={16} />
                Template
              </button>
              
              <label className="flex items-center gap-2 px-4 py-2 bg-solarized-green text-solarized-base3 rounded-lg hover:bg-solarized-green/90 transition-colors cursor-pointer text-sm">
                <Upload size={16} />
                {isProcessing && importType === 'workouts' ? 'Processing...' : 'Import CSV'}
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, 'workouts')}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Import Instructions */}
        <div className="mt-6 p-4 bg-solarized-blue/10 rounded-lg border border-solarized-blue/20">
          <h5 className="font-medium text-solarized-base02 mb-2">CSV Format Guidelines:</h5>
          <ul className="text-sm text-solarized-base01 space-y-1">
            <li>• Use comma-separated values (CSV format)</li>
            <li>• First row should contain column headers</li>
            <li>• Exercise categories: abs, legs, arms, back, shoulders, chest, cardio, full-body</li>
            <li>• Date format: YYYY-MM-DD (e.g., 2024-01-15)</li>
            <li>• <strong>Set numbers are crucial:</strong> Use 1, 2, 3, etc. for proper set position tracking</li>
            <li>• Download templates above for exact format examples</li>
          </ul>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-solarized-base2 rounded-xl p-6 shadow-lg border border-solarized-base1">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-base02">
          <Download size={20} className="text-solarized-green" />
          Export Data
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={handleExportDetailed}
            disabled={workouts.length === 0}
            className="flex items-center justify-center gap-2 bg-solarized-blue text-solarized-base3 py-3 px-4 rounded-lg font-medium hover:bg-solarized-blue/90 transition-colors disabled:bg-solarized-base1 disabled:cursor-not-allowed shadow-md"
          >
            <FileText size={18} />
            Export Detailed Workouts (CSV)
          </button>
          
          <button
            onClick={handleExportSummary}
            disabled={workouts.length === 0}
            className="flex items-center justify-center gap-2 bg-solarized-green text-solarized-base3 py-3 px-4 rounded-lg font-medium hover:bg-solarized-green/90 transition-colors disabled:bg-solarized-base1 disabled:cursor-not-allowed shadow-md"
          >
            <FileText size={18} />
            Export Summary (CSV)
          </button>

          <button
            onClick={handleExportExercises}
            disabled={exercises.length === 0}
            className="flex items-center justify-center gap-2 bg-solarized-violet text-solarized-base3 py-3 px-4 rounded-lg font-medium hover:bg-solarized-violet/90 transition-colors disabled:bg-solarized-base1 disabled:cursor-not-allowed shadow-md"
          >
            <Dumbbell size={18} />
            Export Exercises (CSV)
          </button>
        </div>
        
        <p className="text-sm text-solarized-base01 mt-3">
          Detailed export includes every set for accurate max/average calculations. Summary export shows daily totals. Exercise export includes all your created exercises.
        </p>
      </div>

      {/* Reset App Section */}
      <div className="bg-solarized-red/10 rounded-xl p-6 shadow-lg border border-solarized-red/20">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-solarized-red">
          <RotateCcw size={20} />
          Reset Application
        </h3>
        
        <p className="text-sm text-solarized-base01 mb-4">
          This will permanently delete all your exercises, workouts, and templates. This action cannot be undone.
        </p>
        
        {!showResetConfirm ? (
          <button
            onClick={handleResetApp}
            className="bg-solarized-red text-solarized-base3 py-3 px-4 rounded-lg font-medium hover:bg-solarized-red/90 transition-colors shadow-md"
          >
            Reset All Data
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-solarized-red">
              Are you sure? This will delete everything and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleResetApp}
                className="bg-solarized-red text-solarized-base3 py-2 px-4 rounded-lg font-medium hover:bg-solarized-red/90 transition-colors shadow-md"
              >
                Yes, Reset Everything
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="bg-solarized-base1 text-solarized-base02 py-2 px-4 rounded-lg font-medium hover:bg-solarized-base0 transition-colors shadow-md"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}