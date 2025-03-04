
/**
 * Utility to load the OTPless SDK
 */
export const loadOtplessSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
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
        console.log('OTPless script loaded successfully');
        
        // Give the script a moment to initialize
        setTimeout(() => {
          if (window.otpless) {
            console.log('OTPless SDK initialized and detected');
            resolve();
          } else {
            console.error('OTPless script loaded but window.otpless is not available');
            reject(new Error('OTPless SDK failed to initialize after loading'));
          }
        }, 1000); // Wait 1 second for the script to initialize
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
