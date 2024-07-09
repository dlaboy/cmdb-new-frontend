import { useContext, useEffect, useState } from "react";
import { Stack, TextField, divProperties } from "@fluentui/react";
import { getTokenOrRefresh } from './token_util';
import { Send28Filled, BookOpenMicrophone28Filled, SlideMicrophone32Filled } from "@fluentui/react-icons";
import { ResultReason, SpeechConfig, AudioConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';

import styles from "./QuestionInput.module.css";
import { darkContext } from "../../pages/context/darkMode";
interface Props {
    onSend: (question: string) => void;
    disabled: boolean;
    placeholder?: string;
    clearOnSend?: boolean;
}

export const QuestionInput = ({ onSend, disabled, placeholder, clearOnSend }: Props) => {
    const [question, setQuestion] = useState<string>("");
    const {starter, setStarter} = useContext(darkContext)


    const [triggerStarter,setTrigger] = useState(0)
    
    useEffect(()=>{
        if(starter !== ""){
            setQuestion(starter)
            setTrigger(prev => prev + 1)
        }  
    },[starter])

    // useEffect(()=>{
    //     onSend(question)
    //     if (clearOnSend) {
    //         setQuestion("");
    //     }
    // },[triggerStarter])
    const sendQuestion = () => {
        if (disabled || !question.trim()) {
            return;
        }

        onSend(question);

        if (clearOnSend) {
            setQuestion("");
            setStarter("")
        }
    };

    const sttFromMic = async () => {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = tokenObj.speechRecognitionLanguage;
        
        const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

        const userLanguage = navigator.language;
        let reiniciar_text = '';
        if (userLanguage.startsWith('pt')) {
          reiniciar_text = 'Pode falar usando seu microfone...';
        } else if (userLanguage.startsWith('es')) {
          reiniciar_text = 'Puedes hablar usando su micrófono...';
        } else {
          reiniciar_text = 'You can talk using your microphone...';
        }

        setQuestion(reiniciar_text);

        recognizer.recognizeOnceAsync(result => {
            let displayText;
            if (result.reason === ResultReason.RecognizedSpeech) {
                displayText = result.text;
                //setQuestion(displayText);
                //onSend(question);
            } else {
                displayText = 'ERROR: Voice recognition was canceled or the voice cannot be recognized. Make sure your microphone is working properly.';
                //setQuestion(displayText);
            }
            setQuestion(displayText);
        });
    };

    const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
        if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            sendQuestion();
        }
    };

    const onQuestionChange = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        if (!newValue) {
            setQuestion("");
        } else if (newValue.length <= 1000) {
            setQuestion(newValue);
        }
    };

    const sendQuestionDisabled = disabled || !question.trim();

    const {isDark, setIsDark} = useContext(darkContext)

    return (
        <Stack horizontal className={`${isDark ? styles.questionInputContainer:styles.questionInputContainerDark }`}>
            <TextField
                   style={{
                    backgroundColor: isDark ? '#fff' : '#393939',
                    color: isDark ? '#292929' : '#fff',
                    transition: 'background-color 0.5s ease-in-out'

                }}
                className={styles.questionInputTextArea}
                placeholder={placeholder}
                multiline
                resizable={false}
                borderless
                value={question}
                onChange={onQuestionChange}
                onKeyDown={onEnterPress}
            />
            <div className={styles.questionInputButtonsContainer}>
                    <div
                        className={`${styles.questionInputSendButton} ${sendQuestionDisabled ? styles.questionInputSendButtonDisabled : ""}`}
                        aria-label="Boton hacer preguntas"
                        onClick={sendQuestion}
                    >
                        <Send28Filled primaryFill="goldenrod" />
                    </div>
                    {/* <div
                        className={`${styles.questionInputSendButton}}`}
                        aria-label="Boton hablar"
                        onClick={sttFromMic}
                    >
                        <SlideMicrophone32Filled primaryFill="rgba(115, 118, 225, 1)" />
                    </div> */}
             </div>
     
        </Stack>
    );
};
