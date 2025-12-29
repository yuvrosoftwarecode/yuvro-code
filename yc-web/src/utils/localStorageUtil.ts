export const safeLocalStorage = {

  getItem(key: string): string | null {
    try {
      const value = localStorage.getItem(key);
      // Check for corrupted string values
      if (value === 'undefined' || value === 'null') {
        localStorage.removeItem(key);
        return null;
      }
      return value;
    } catch (error) {
      console.error(`Error getting localStorage item "${key}":`, error);
      return null;
    }
  },

  /**
   * Safely set an item in localStorage
   */
  setItem(key: string, value: string): void {
    try {
      // Don't store undefined or null as strings
      if (value === undefined || value === null || value === 'undefined' || value === 'null') {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting localStorage item "${key}":`, error);
    }
  },

  /**
   * Safely remove an item from localStorage
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage item "${key}":`, error);
    }
  },

  /**
   * Safely parse JSON from localStorage
   */
  getJSON<T>(key: string, fallback: T | null = null): T | null {
    const value = this.getItem(key);
    if (!value) return fallback;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error parsing JSON from localStorage "${key}":`, error);
      this.removeItem(key); // Clean up corrupted data
      return fallback;
    }
  },

  /**
   * Safely store JSON in localStorage
   */
  setJSON<T>(key: string, value: T): void {
    try {
      if (value === undefined || value === null) {
        this.removeItem(key);
        return;
      }
      this.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error storing JSON in localStorage "${key}":`, error);
    }
  },

  /**
   * Clean up corrupted localStorage data
   */
  cleanup(): void {
    const keysToCheck = ['access', 'refresh', 'user'];
    keysToCheck.forEach(key => {
      const value = localStorage.getItem(key);
      if (value === 'undefined' || value === 'null') {
        localStorage.removeItem(key);
        console.log(`Cleaned up corrupted localStorage key: ${key}`);
      }
    });
  }
};