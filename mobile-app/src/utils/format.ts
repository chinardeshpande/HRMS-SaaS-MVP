import { format, parseISO, isValid } from 'date-fns';

/**
 * Utility functions for pretty printing data inside the app
 */

export const formatDate = (dateString?: string, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!dateString) return '-';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    return format(date, formatStr);
  } catch {
    return dateString;
  }
};

export const formatTime = (dateString?: string): string => {
  if (!dateString) return '--:--';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '--:--';
    return format(date, 'hh:mm a');
  } catch {
    return '--:--';
  }
};

export const formatDuration = (hours?: number): string => {
  if (hours === undefined || hours === null || isNaN(hours)) return '0h 0m';
  const hrs = Math.floor(hours);
  const mins = Math.round((hours - hrs) * 60);
  return `${hrs}h ${mins}m`;
};

export const formatBytes = (bytes?: number): string => {
  if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const capitalize = (str?: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getStatusColor = (status?: string): string => {
  if (!status) return '#6b7280'; // gray-500
  const lower = status.toLowerCase();
  if (['approved', 'active', 'present', 'cleared', 'confirm', 'success'].includes(lower)) {
    return '#22c55e'; // green-500
  }
  if (['pending', 'half_day', 'late', 'extend', 'offer_released', 'documents_pending'].includes(lower)) {
    return '#f59e0b'; // warning-500 / amber
  }
  if (['rejected', 'absent', 'inactive', 'exited', 'cancelled', 'terminate', 'failed'].includes(lower)) {
    return '#ef4444'; // danger-500 / red
  }
  if (['leave', 'joined', 'ready_to_join', 'accepted'].includes(lower)) {
    return '#0A66C2'; // primary-500 / brand blue
  }
  return '#9333ea'; // purple-600 (default fallback for custom statuses)
};
