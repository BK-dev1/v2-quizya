'use client';

import { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n/config';
import { useAuth } from '@/lib/hooks/use-auth';

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserLanguage = async () => {
      if (user) {
        try {
          // Try to fetch user's language preference
          const res = await fetch('/api/settings/preferences');
          if (res.ok) {
            const settings = await res.json();
            const userLanguage = settings?.language;
            
            if (userLanguage && userLanguage !== i18n.language) {
              await i18n.changeLanguage(userLanguage);
              
              // Update HTML direction for RTL languages
              if (userLanguage === 'ar') {
                document.documentElement.dir = 'rtl';
                document.documentElement.lang = 'ar';
              } else {
                document.documentElement.dir = 'ltr';
                document.documentElement.lang = userLanguage;
              }
            }
          }
        } catch (error) {
          console.error('Error loading user language:', error);
        }
      }
      setLoading(false);
    };

    loadUserLanguage();
  }, [user]);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}