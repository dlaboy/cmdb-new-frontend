import React, { useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { initializeIcons } from "@fluentui/react";

import "./index.css";

import Layout from "./pages/layout/Layout";
import NoPage from "./pages/NoPage";
import Chat from "./pages/chat/Chat";

import { darkContext } from "./pages/context/darkMode";
import { AppStateProvider } from "./state/AppProvider";

initializeIcons();

export default function App() {
    const [isDark, setIsDark] = useState(true)

    const [seeCH, setSeeCH] = useState(false)

    const [userLanguage, setLanguage] = useState("en"); // Default language is English

  const [starter,setStarter] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const lastQuestionRef = useRef<string>("");


  



    
    return (
    <AppStateProvider>

        <darkContext.Provider value={{lastQuestionRef,isLoading,setIsLoading,file,setFile,isDark,setIsDark, seeCH,setSeeCH,userLanguage,setLanguage,starter,setStarter}}>
            <HashRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Chat />} />
                        <Route path="*" element={<NoPage />} />
                    </Route>
                </Routes>
            </HashRouter>
        </darkContext.Provider>
    </AppStateProvider>

    );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
