
/**
 * Utility to load the OTPless SDK
 */
export const loadOtplessSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // If script already exists, resolve immediately
      if (document.getElementById('otpless-sdk')) {
        console.log('OTPless SDK already loaded, resolving immediately');
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://otpless.com/auth.js';
      script.id = 'otpless-sdk';
      script.async = true;
      
      // Add event listeners for successful load and error
      script.onload = () => {
        console.log('OTPless SDK loaded successfully');
        resolve();
      };
      
      script.onerror = (error) => {
        console.error('Failed to load OTPless SDK', error);
        script.remove();
        reject(new Error('Failed to load OTPless SDK'));
      };
      
      // Append to document body
      document.body.appendChild(script);
      console.log('OTPless SDK script added to document');
    } catch (err) {
      console.error('Unexpected error loading OTPless SDK:', err);
      reject(err);
    }
  });
};

