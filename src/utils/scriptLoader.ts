
/**
 * Utility to dynamically load external scripts
 */
export const loadScript = (src: string, id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // If script already exists, resolve immediately
      if (document.getElementById(id)) {
        console.log(`Script ${id} already exists, resolving immediately`);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.async = true;
      
      // Add event listeners for successful load and error
      script.onload = () => {
        console.log(`Script ${id} loaded successfully`);
        resolve();
      };
      
      script.onerror = (error) => {
        console.error(`Failed to load script: ${src}`, error);
        // Remove the failed script tag
        script.remove();
        reject(new Error(`Failed to load script: ${src}`));
      };
      
      // Append to document body
      document.body.appendChild(script);
      console.log(`Script ${id} added to document body`);
    } catch (err) {
      console.error(`Unexpected error loading script ${id}:`, err);
      reject(err);
    }
  });
};
