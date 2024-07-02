import { Text } from "@fluentui/react";
import { Delete24Regular,History24Regular  } from "@fluentui/react-icons";


import styles from "./ConversationHistory.module.css";
import { useContext, useState, useEffect } from "react";
import { darkContext } from "../../pages/context/darkMode";

interface Props {
    className?: string;
    onClick: () => void;
    disabled?: boolean;
}

// const userLanguage = navigator.language;
// // const userLanguage = 'es';

// let reiniciar_text = '';
// if (userLanguage.startsWith('pt')) {
//   reiniciar_text = 'Conversation History';
// } else if (userLanguage.startsWith('es')) {
//   reiniciar_text = 'Historial de Conversaciones';
// } else {
//   reiniciar_text = 'Conversation History ';
// }

export const ConversationHistoryButton = ({ className, disabled, onClick }: Props) => {
  const {isDark,setIsDark} = useContext(darkContext)
  const {userLanguage,setLanguage} = useContext(darkContext)
  const [reiniciar_text,setReiniciarText] = useState("Restart conversation")
  
  
  // const userLanguage = navigator.language;
  useEffect(()=>{
  
    if (userLanguage.startsWith('pt')) {
      setReiniciarText("Histórico de Conversas")
    } else if (userLanguage.startsWith('es')) {
      setReiniciarText('Historial de Conversaciones')
  
    } else {
      setReiniciarText('Conversation History')
  
    }
  },[userLanguage])
    
  return (
        <a className={`${styles.container} ${className ?? ""} ${disabled && styles.disabled}`} onClick={onClick}>
            <History24Regular style={{color: isDark ? '#292929' : '#fff'}}/>
            <Text style={{color: isDark ? '#292929' : '#fff'}}>{reiniciar_text}</Text>
        </a>
    );
};
