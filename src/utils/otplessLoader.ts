
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
        console.log('Found existing script tag but window.otpless not available, removing...');
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = 'https://otpless.com/auth.js';
      script.id = 'otpless-sdk';
      script.async = true;
      
      // Add event listeners for successful load and error
      script.onload = () => {
        console.log('OTPless SDK loaded successfully');
        // Check if otpless object is available after loading
        if (window.otpless) {
          console.log('OTPless SDK initialized successfully');
          resolve();
        } else {
          console.error('OTPless SDK script loaded but window.otpless is not available');
          setTimeout(() => {
            if (window.otpless) {
              console.log('OTPless SDK initialized after delay');
              resolve();
            } else {
              const err = new Error('OTPless SDK failed to initialize after loading');
              console.error(err);
              script.remove();
              reject(err);
            }
          }, 1000); // Give a second for the script to initialize
        }
      };
      
      script.onerror = (error) => {
        console.error('Failed to load OTPless SDK', error);
        script.remove();
        reject(new Error('Failed to load OTPless SDK'));
      };
      
      // Append to document head (more reliable than body)
      document.head.appendChild(script);
      console.log('OTPless SDK script added to document head');
    } catch (err) {
      console.error('Unexpected error loading OTPless SDK:', err);
      reject(err);
    }
  });
};
