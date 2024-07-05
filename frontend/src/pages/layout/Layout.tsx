import { Outlet, NavLink, Link } from "react-router-dom";

import github from "../../assets/github.svg";
import evertec from "../../assets/evertec.png";

import styles from "./Layout.module.css";
import { darkContext } from "../context/darkMode";
import { ConversationHistoryButton } from "../../components/ConversationHistoryButton";
import { useContext, useEffect, useState, useLayoutEffect } from 'react'
import { Dialog, Stack, TextField } from '@fluentui/react'
import { CopyRegular } from '@fluentui/react-icons'

import { CosmosDBStatus } from '../../api'
import Contoso from '../../assets/Contoso.svg'
import { HistoryButton, ShareButton } from '../../components/common/Button'
import { AppStateContext } from '../../state/AppProvider'
import { ChatHistoryPanel } from "../../components/ChatHistory/ChatHistoryPanel";
import { useBoolean } from "@fluentui/react-hooks";

import {
    ChatMessage,
    ConversationRequest,
    conversationApi,
    Citation,
    ToolMessageContent,
    AzureSqlServerExecResults,
    ChatResponse,
    getUserInfo,
    Conversation,
    historyGenerate,
    historyUpdate,
    historyClear,
    ChatHistoryLoadingState,
    ErrorMessage,
    ExecResults,
  } from "../../api";

const Layout = () => {
    const [isSharePanelOpen, setIsSharePanelOpen] = useState<boolean>(false)
  const [copyClicked, setCopyClicked] = useState<boolean>(false)
  const [copyText, setCopyText] = useState<string>('Copy URL')
  const [shareLabel, setShareLabel] = useState<string | undefined>('Share')
  const [hideHistoryLabel, setHideHistoryLabel] = useState<string>('Hide chat history')
  const [showHistoryLabel, setShowHistoryLabel] = useState<string>('Show chat history')
  const appStateContext = useContext(AppStateContext)
  const ui = appStateContext?.state.frontendSettings?.ui
  const [hideErrorDialog, { toggle: toggleErrorDialog }] = useBoolean(true)


    const {isDark,setIsDark} = useContext(darkContext)
    const {seeCH,setSeeCH} = useContext(darkContext)
    const {userLanguage,setLanguage} = useContext(darkContext)
    const [errorMsg, setErrorMsg] = useState<ErrorMessage | null>()

    useEffect(() => {
        if (
          appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.Working &&
          appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.NotConfigured &&
          appStateContext?.state.chatHistoryLoadingState === ChatHistoryLoadingState.Fail &&
          hideErrorDialog
        ) {
          let subtitle = `${appStateContext.state.isCosmosDBAvailable.status}. Please contact the site administrator.`
          setErrorMsg({
            title: 'Chat history is not enabled',
            subtitle: subtitle
          })
          toggleErrorDialog()
        }
      }, [appStateContext?.state.isCosmosDBAvailable])
    
    useEffect(() => {
        const handleResize = () => {
          if (window.innerWidth < 480) {
            setShareLabel(undefined)
            setHideHistoryLabel('Hide history')
            setShowHistoryLabel('Show history')
          } else {
            setShareLabel('Share')
            setHideHistoryLabel('Hide chat history')
            setShowHistoryLabel('Show chat history')
          }
        }
    
        window.addEventListener('resize', handleResize)
        handleResize()
    
        return () => window.removeEventListener('resize', handleResize)
      }, [])
    
    // Function to change the language
    const changeLanguage = (lang:string) => {
      setLanguage(lang);
    };
  
    // Texts in different languages
    type String = {
        en: {
          darkMode: string;
          lightMode: string;
        };
        pt: {
          darkMode: string;
          lightMode: string;
        };
        es: {
          darkMode: string;
          lightMode: string;
        };
        // Extend with additional languages as needed
      };
      
      const texts:{ [key: string]: { darkMode: string, lightMode:string } } = {
        en: {
          darkMode: 'Dark',
          lightMode: 'Light',
        },
        pt: {
          darkMode: 'Escuro',
          lightMode: 'Claro',
        },
        es: {
          darkMode: 'Oscuro',
          lightMode: 'Claro',
        },
        // Add more languages as needed
      };
      

    const handleDark = () =>{

        setIsDark(false)
    }
    const handleLight = () =>{

        setIsDark(true)
    }

    const handleHistoryClick = () => {
        appStateContext?.dispatch({ type: 'TOGGLE_CHAT_HISTORY' })
      }

      
  

    useEffect(() => {}, [appStateContext?.state.isCosmosDBAvailable.status])

    useEffect(() => {
        const handleResize = () => {
          if (window.innerWidth < 480) {
            setShareLabel(undefined)
            setHideHistoryLabel('Hide history')
            setShowHistoryLabel('Show history')
          } else {
            setShareLabel('Share')
            setHideHistoryLabel('Hide chat history')
            setShowHistoryLabel('Show chat history')
          }
        }
    
        window.addEventListener('resize', handleResize)
        handleResize()
    
        return () => window.removeEventListener('resize', handleResize)
      }, [])
      
    const [showLanguages,setShowLanguages] = useState(false)
    const [showTemas, setShowTemas] = useState(false)
    const [showSetting, setShowSetting] = useState(false)

    const {isLoading,setIsLoading} = useContext(darkContext);
    const {lastQuestionRef} = useContext(darkContext);

    

    const toggleSettings =() =>{
        setShowSetting(prev => !prev)
    }

    const toggleLanguages = ()=>{
        setShowLanguages(prev => !prev)
    }
    const toggleTemas = ()=>{
        setShowTemas(prev => !prev)
    }

    const toggleConversation =()=>{
        setSeeCH(prev => !prev)
    }
    return (
        <div className={styles.layoutContainer}>    
         
        
            <div className={styles.layout}>
                <header className={`${isDark ? styles.header:styles.headerDark }`} role={"banner"}>
                    <div className={styles.headerContainer}>
                        {/* <div className=""></div>
                        <div>
                            <button onClick={() => changeLanguage('en')}>English</button>
                            <button onClick={() => changeLanguage('pt')}>Português</button>
                            <button onClick={() => changeLanguage('es')}>Español</button>
                        </div> */}
                        {/* <a onClick={handleDark} className={styles.darkToggle}>{isDark ? texts[language].darkMode : texts[language].lightMode}</a> */}
                        <Link to="/" className={styles.headerTitleContainer}>
                            {/* <img height="80px" src="https://news.microsoft.com/wp-content/uploads/prod/sites/113/2017/06/Microsoft-logo_rgb_c-gray.png"></img> */}
                            <img height="50px" src={evertec} className={styles.evertecHeader}></img>
                            {/* <h3 className={styles.headerTitle}></h3> */}
                        </Link>
                        {/* <nav>
                            
                            <ul className={styles.headerNavList}>
                                <li>
                                    <NavLink to="/" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                                        Chat
                                    </NavLink>
                                </li>
                                <li className={styles.headerNavLeftMargin}>
                                    <NavLink to="/qa" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                                        Ask a question
                                    </NavLink>
                                </li>
                                <li className={styles.headerNavLeftMargin}>
                                    <a href="https://aka.ms/entgptsearch" target={"_blank"} title="Github repository link">
                                        <img
                                            src={github}
                                            alt="Github logo"
                                            aria-label="Link to github repository"
                                            width="20px"
                                            height="20px"
                                            className={styles.githubLogo}
                                        />
                                    </a>
                                </li>
                            </ul>
    
                        </nav> */}
                        {/* <h4 className={styles.headerRightText}>Chat On Your Data</h4> */}
                        <div className={styles.leftContainer}>
                            
                            {appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.NotConfigured && (
                            // <HistoryButton
                            //     onClick={handleHistoryClick}
                            //     text={appStateContext?.state?.isChatHistoryOpen ? hideHistoryLabel : showHistoryLabel}
                            // />
                            <ConversationHistoryButton  className={styles.commandButton} onClick={handleHistoryClick} />

                            )}

                            <div className={styles.settingsContainer}>
                                <div className="">
                                    <a onClick={toggleSettings}><img src="/setting (1).png" height="30px"  alt="" /></a> 
                                </div>
                                <div className={`${showSetting ? styles.settingTabContainerHide:styles.settingTabContainer}`}>
                                    <div className={`${isDark ? styles.settingsTab:styles.settingsTabDark }`}>
                                        <div className="">
                                            Settings
                                        </div>
                                        <div className={styles.settingsOptions}>
                                            <div onClick={toggleTemas} className={`${isDark ? styles.settingOption:styles.settingOptionDark }`}>
                                                <img src="/themes.png" height="20px" alt="" />
                                                <a className={styles.settingLink} >Themes</a>
                                            </div>
                                            <div className={`${showTemas ? styles.themeOptionsContainer:styles.themeOptionsContainerHide }`}>
                                                <div className={`${isDark ? styles.themeOptions:styles.themeOptionsDark }`}>
                                                    <div className={styles.themeOption}>
                                                        {/* <img src="/moon (1).png" height="15px" alt="" /> */}
                                                        <a  onClick={handleDark} className={styles.themeLink}>{texts[userLanguage].darkMode}</a>
                                                    </div>
                                                    <div className={styles.themeOption}>
                                                        {/* <img src="/sunny.png" height="15px" alt="" /> */}
                                                        <a onClick={handleLight} className={styles.themeLink}>{texts[userLanguage].lightMode}</a>
                                                    </div>
                                                </div>
                                            </div>
                                            <div  onClick={toggleLanguages} className={`${isDark ? styles.settingOption:styles.settingOptionDark }`}>
                                                <img src="/language (1).png" height="20px" alt="" />
                                                <a className={styles.settingLink}>Languages</a>
                                            </div>
                                            <div className={`${showLanguages ? styles.langOptionsContainer:styles.langOptionsContainerHide }`}>
                                                <div className={`${isDark ? styles.themeOptions:styles.themeOptionsDark }`}>
                                                    <a onClick={() => changeLanguage('en')} className={styles.langButton}>English</a>
                                                    <a onClick={() => changeLanguage('pt')} className={styles.langButton}>Português</a>
                                                    <a onClick={() => changeLanguage('es')} className={styles.langButton}>Español</a>
                                                </div>
                                            </div>

                                        </div>                                
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </header>

                <Outlet />
            </div>
            {/* <div className={`${seeCH ? styles.conversationHistory:styles.conversationHistoryHide }`}>
                <div className={`${isDark ? styles.history:styles.historyDark }`}>
                       Here You'll See Your Conversation History
                </div>
            </div> */}
            {appStateContext?.state.isChatHistoryOpen &&
            appStateContext?.state.isCosmosDBAvailable?.status !== CosmosDBStatus.NotConfigured && <ChatHistoryPanel />}

        </div>
    );
};

export default Layout;
