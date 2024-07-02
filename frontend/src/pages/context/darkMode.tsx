import { RefObject } from "@fluentui/react";
import React, { createContext, useState, ReactNode, useRef } from "react";



// Define the type for context values
interface DarkContextProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  seeCH: boolean;
  setSeeCH: React.Dispatch<React.SetStateAction<boolean>>;
  userLanguage: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  starter: string;
  setStarter: React.Dispatch<React.SetStateAction<string>>;
  file: File|null;
  setFile: React.Dispatch<React.SetStateAction<File|null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  lastQuestionRef: React.MutableRefObject<string>;


}

// Create the context with initial values
const initialContext: DarkContextProps = {
  isDark: true,
  setIsDark: () => {},
  seeCH: false,
  setSeeCH: () => {},
  userLanguage: 'en',
  setLanguage: () => {},
  starter: '',
  setStarter: () => {},
  file: null,
  setFile: () => {}, 
  isLoading: false,
  setIsLoading: () => {}, 
  lastQuestionRef: undefined! as React.MutableRefObject<string>
  
};

// Create the context
export const darkContext = createContext(initialContext);

// Define props interface for the provider component
interface DarkThemeProviderProps {
  children: ReactNode;
}

// Create the provider component
export const DarkThemeProvider: React.FC<DarkThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [seeCH, setSeeCH] = useState(false);
  const [userLanguage, setLanguage] = useState('en'); // Default language is English
  const [starter,setStarter] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const lastQuestionRef = useRef<string>("");




  

  // Context value object
  const contextValue: DarkContextProps = {
    isDark,
    setIsDark,
    seeCH,
    setSeeCH,
    userLanguage,
    setLanguage,
    starter,
    setStarter,
    file,
    setFile,
    isLoading,
    setIsLoading,
    lastQuestionRef
  };

  // Render provider with context value
  return (
    <darkContext.Provider value={contextValue}>
      {children}
    </darkContext.Provider>
  );
};
