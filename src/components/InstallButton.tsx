import { useEffect } from "react";

export function InstallButton() {
  useEffect(() => {
    const addToHomeScreen = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          if (registration.active) {
            const installPrompt = (window as any).installPrompt;
            if (installPrompt) {
              installPrompt.prompt();
              installPrompt.then(() => {
                console.log('App installed successfully!');
              });
            } else {
              console.log('No install prompt available.');
            }
          } else {
            console.log('Service worker not active.');
          }
        } catch (error) {
          console.error('Failed to add to home screen:', error);
        }
      }
    };

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <button onClick={addToHomeScreen} className="px-4 py-2 bg-primary text-white rounded-full">
      Add to Home Screen
    </button>
  );
}