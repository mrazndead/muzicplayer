import { useState, useEffect, useCallback, useRef } from "react";

export interface SleepTimerState {
  isActive: boolean;
  remainingSeconds: number;
  selectedMinutes: number | null;
}

export function useSleepTimer(onTimerEnd: () => void) {
  const [state, setState] = useState<SleepTimerState>({
    isActive: false,
    remainingSeconds: 0,
    selectedMinutes: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback((minutes: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState({
      isActive: true,
      remainingSeconds: minutes * 60,
      selectedMinutes: minutes,
    });
  }, []);

  const cancelTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState({ isActive: false, remainingSeconds: 0, selectedMinutes: null });
  }, []);

  useEffect(() => {
    if (!state.isActive) return;

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.remainingSeconds <= 1) {
          onTimerEnd();
          return { isActive: false, remainingSeconds: 0, selectedMinutes: null };
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isActive, onTimerEnd]);

  return { ...state, startTimer, cancelTimer };
}

export const SLEEP_TIMER_OPTIONS = [
  { label: "5 min", minutes: 5 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "45 min", minutes: 45 },
  { label: "1 hour", minutes: 60 },
];
