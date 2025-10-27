'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateFiles, MAX_FILE_SIZE, MAX_FILES_PER_UPLOAD } from '@/lib/security/validation';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  errors?: string[];
}

interface UploadZoneProps {
  onUpload?: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

export function UploadZone({ onUpload, maxFiles = 10, className = "" }: UploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate all files before processing
    const validationResult = validateFiles(acceptedFiles);
    
    if (!validationResult.valid) {
      setValidationErrors(validationResult.errors);
      
      // Show file-specific errors
      if (validationResult.fileErrors.size > 0) {
        const fileErrorMessages: string[] = [];
        validationResult.fileErrors.forEach((errors, filename) => {
          fileErrorMessages.push(`${filename}: ${errors.join(', ')}`);
        });
        setValidationErrors(prev => [...prev, ...fileErrorMessages]);
      }
      return;
    }

    // Clear previous validation errors
    setValidationErrors([]);

    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2),
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading' as const,
      progress: 0,
      errors: [],
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach(fileObj => {
      const interval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, progress: Math.min(f.progress + 10, 100) }
              : f
          )
        );
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileObj.id 
              ? { ...f, status: 'success', progress: 100 }
              : f
          )
        );
      }, 2000);
    });

    onUpload?.(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles,
    multiple: true,
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Validation Errors */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                  Validation Errors
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-300">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setValidationErrors([])}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          drop-zone hover-lift
          ${isDragActive 
            ? 'drop-zone-active' 
            : 'drop-zone-inactive'
          }
        `}
      >
        <input {...getInputProps()} />
          <div className="space-y-4">
            <div className={`transform transition-transform ${isDragActive ? 'scale-110' : 'scale-100'}`}>
              <Upload className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
              {isDragActive ? 'Drop your images here!' : 'Upload your photos'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Drag and drop your images here, or click to browse
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              Supports JPEG, PNG, GIF, WebP up to {MAX_FILE_SIZE / 1024 / 1024}MB each (max {MAX_FILES_PER_UPLOAD} files)
            </p>
            </div>
          </div>
        </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 space-y-4"
          >
            <h4 className="text-lg font-semibold">Uploading Files</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((fileObj) => (                  <motion.div
                  key={fileObj.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative card-base p-4"
                >
                  <button
                    onClick={() => removeFile(fileObj.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
                    <img 
                      src={fileObj.preview} 
                      alt={fileObj.file.name}
                      className="w-full h-full object-cover"
                    />
                    {fileObj.status === 'success' && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {fileObj.file.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {(fileObj.file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    </div>
                    
                    {fileObj.status === 'uploading' && (
                      <div className="progress-bar">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${fileObj.progress}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                    )}
                    
                    {fileObj.status === 'success' && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Upload complete</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
