import { useContext } from "react";
import styles from "./UserChatMessage.module.css";
import { darkContext } from "../../pages/context/darkMode";

interface Props {
    message: string;
}

export const UserChatMessage = ({ message }: Props) => {
    const {isDark,setIsDark} = useContext(darkContext)
    
    return (
        <div className={styles.container}>
            <div className={`${isDark ? styles.message:styles.messageDark } `}>{message}</div>
        </div>
    );
};
