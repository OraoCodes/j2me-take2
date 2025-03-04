
/**
 * Utility to load the OTPless SDK
 */
export const loadOtplessSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Check if script already exists and is properly loaded
      if (document.getElementById('otpless-sdk') && window.otpless) {
        console.log('OTPless SDK already loaded and available, resolving immediately');
        resolve();
        return;
      }
      
      // Clean up any existing script to prevent conflicts
      const existingScript = document.getElementById('otpless-sdk');
      if (existingScript) {
        console.log('Found existing script tag, removing to ensure clean load');
        existingScript.remove();
      }

      console.log('Starting fresh OTPless SDK load');
      
      // Create a new script element
      const script = document.createElement('script');
      script.src = 'https://otpless.com/auth.js';
      script.id = 'otpless-sdk';
      script.async = true;
      
      // Add event listeners for successful load and error
      script.onload = () => {
        console.log('OTPless SDK script loaded, waiting for initialization');
        
        // Use a polling approach to check for the otpless object
        let attempts = 0;
        const maxAttempts = 20; // More attempts with shorter intervals
        const checkInterval = 200; // Check every 200ms
        
        const checkOtpless = () => {
          attempts++;
          if (window.otpless) {
            console.log(`OTPless SDK initialized successfully after ${attempts} checks`);
            resolve();
            return;
          }
          
          if (attempts >= maxAttempts) {
            const err = new Error(`OTPless SDK failed to initialize after ${maxAttempts} attempts`);
            console.error(err);
            script.remove();
            reject(err);
            return;
          }
          
          console.log(`Waiting for OTPless SDK to initialize (attempt ${attempts}/${maxAttempts})`);
          setTimeout(checkOtpless, checkInterval);
        };
        
        // Start polling
        checkOtpless();
      };
      
      script.onerror = (error) => {
        console.error('Failed to load OTPless SDK', error);
        script.remove();
        reject(new Error('Failed to load OTPless SDK'));
      };
      
      // Append to document head
      document.head.appendChild(script);
      console.log('OTPless SDK script added to document head');
    } catch (err) {
      console.error('Unexpected error loading OTPless SDK:', err);
      reject(err);
    }
  });
};
