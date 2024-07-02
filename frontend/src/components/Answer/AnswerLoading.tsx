import { Stack } from "@fluentui/react";
import { animated, useSpring } from "@react-spring/web";

import styles from "./Answer.module.css";
import { AnswerIcon } from "./AnswerIcon";
import { useContext, useEffect, useState } from "react";
import { darkContext } from "../../pages/context/darkMode";

// const userLanguage = navigator.language;
// let generating_answer_text = '';
// if (userLanguage.startsWith('pt')) {
//   generating_answer_text = 'Gerando resposta';
// } else if (userLanguage.startsWith('es')) {
//   generating_answer_text = 'Generando respuesta';
// } else {
//   generating_answer_text = 'Generating response';
// }

export const AnswerLoading = () => {
    const animatedStyles = useSpring({
        from: { opacity: 0 },
        to: { opacity: 1 }
    });

    const {userLanguage,setLanguage} = useContext(darkContext)
    const [generating_answer_text,setGeneratedAnswerText] = useState("Generating response")

    useEffect(()=>{
        if (userLanguage === "es"){
           setGeneratedAnswerText("Generando respuesta")
        }
        else if (userLanguage ==="pt"){
            setGeneratedAnswerText("Gerando resposta")
        }
        else if (userLanguage === "en"){
            setGeneratedAnswerText("Generating response")
            
        }
    },[userLanguage])
    return (
        <animated.div style={{ ...animatedStyles }}>
            <Stack className={styles.answerContainer} verticalAlign="space-between">
                <AnswerIcon />
                <Stack.Item grow>
                    <p className={styles.answerText}>
                        {generating_answer_text}
                        <span className={styles.loadingdots} />
                    </p>
                </Stack.Item>
            </Stack>
        </animated.div>
    );
};
