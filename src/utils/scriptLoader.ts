
/**
 * Utility to dynamically load external scripts
 */
export const loadScript = (src: string, id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If script already exists, resolve immediately
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = (error) => reject(new Error(`Failed to load script: ${src}`));
    
    document.body.appendChild(script);
  });
};
