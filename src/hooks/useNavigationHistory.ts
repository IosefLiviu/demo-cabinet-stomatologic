import { useState, useCallback, useEffect } from 'react';

export interface NavigationState {
  tab: string;
  patientId?: string;
  patientName?: string;
  context?: string; // e.g., "patient-details", "treatment-plan", etc.
}

interface UseNavigationHistoryProps {
  currentTab: string;
  selectedPatientId?: string;
  selectedPatientName?: string;
}

export function useNavigationHistory({ 
  currentTab, 
  selectedPatientId, 
  selectedPatientName 
}: UseNavigationHistoryProps) {
  const [history, setHistory] = useState<NavigationState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isNavigating, setIsNavigating] = useState(false);

  // Push new state to history
  const pushState = useCallback((state: NavigationState) => {
    if (isNavigating) return;
    
    setHistory(prev => {
      // If we're not at the end, truncate the future
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Don't push duplicate states
      const lastState = newHistory[newHistory.length - 1];
      if (lastState && 
          lastState.tab === state.tab && 
          lastState.patientId === state.patientId &&
          lastState.context === state.context) {
        return newHistory;
      }
      
      return [...newHistory, state];
    });
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, isNavigating]);

  // Go back in history
  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setIsNavigating(true);
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  // Go forward in history
  const goForward = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setIsNavigating(true);
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  // Reset navigation flag after navigation
  const finishNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  // Get previous state info for display
  const previousState = currentIndex > 0 ? history[currentIndex - 1] : null;
  const nextState = currentIndex < history.length - 1 ? history[currentIndex + 1] : null;

  return {
    pushState,
    goBack,
    goForward,
    finishNavigation,
    canGoBack,
    canGoForward,
    previousState,
    nextState,
    isNavigating,
  };
}
