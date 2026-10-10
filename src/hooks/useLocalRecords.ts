import { useState } from "react";
// Namespace demo-only records; never store server responses in the demo sandbox.
export function useLocalRecords<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("ultrapos-demo-" + key) || "null") ??
        initial
      );
    } catch {
      return initial;
    }
  });
  function update(next: T | ((current: T) => T)) {
    setState((current) => {
      const value = next instanceof Function ? next(current) : next;
      localStorage.setItem("ultrapos-demo-" + key, JSON.stringify(value));
      return value;
    });
  }
  return [state, update] as const;
}
