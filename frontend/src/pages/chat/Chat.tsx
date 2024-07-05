import { useRef, useState, useEffect, useContext, useLayoutEffect } from "react";
import { Checkbox, Panel, DefaultButton, TextField, SpinButton } from "@fluentui/react";
import { SparkleFilled, TabDesktopMultipleBottomRegular } from "@fluentui/react-icons";
import { CommandBarButton, IconButton, Dialog, DialogType, Stack } from '@fluentui/react'

// import { isEmpty } from 'lodash'
import uuid from 'react-uuid'


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
    CosmosDBStatus,
    ErrorMessage,
    ExecResults,
  } from "../../api";

import styles from "./Chat.module.css";

import { chatApiGpt, Approaches, AskResponse, ChatRequest, ChatRequestGpt, ChatTurn } from "../../api";
import { Answer, AnswerError, AnswerLoading } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { ExampleList } from "../../components/Example";
import { UserChatMessage } from "../../components/UserChatMessage";
import { AnalysisPanel, AnalysisPanelTabs } from "../../components/AnalysisPanel";
import { ClearChatButton } from "../../components/ClearChatButton";
import { getTokenOrRefresh } from "../../components/QuestionInput/token_util";
import { SpeechConfig, AudioConfig, SpeechSynthesizer, ResultReason } from "microsoft-cognitiveservices-speech-sdk";
import { getFileType } from "../../utils/functions";
import { darkContext } from "../context/darkMode";


import { ChatHistoryPanel } from "../../components/ChatHistory/ChatHistoryPanel";
import { AppStateContext } from "../../state/AppProvider";
import { useBoolean } from "@fluentui/react-hooks";


const enum messageStatus {
    NotRunning = 'Not Running',
    Processing = 'Processing',
    Done = 'Done'
  }
// const language = navigator.language;
// let error_message_text = "";

// if (language.startsWith("pt")) {
//     error_message_text = "Desculpe, tive um problema técnico com a solicitação. Por favor informar o erro a equipe de suporte. ";
  
// } else if (language.startsWith("es")) {
//     error_message_text = "Lo siento, yo tuve un problema con la solicitud. Por favor informe el error al equipo de soporte. ";
  
// } else {
//     error_message_text = "I'm sorry, I had a problem with the request. Please report the error to the support team. ";
  
// }

const Chat = () => {
    // speech synthesis is disabled by default
    const speechSynthesisEnabled = false;
    const appStateContext = useContext(AppStateContext)
    const ui = appStateContext?.state.frontendSettings?.ui
    const AUTH_ENABLED = appStateContext?.state.frontendSettings?.auth_enabled
    const [showLoadingMessage, setShowLoadingMessage] = useState<boolean>(false)
    const [isCitationPanelOpen, setIsCitationPanelOpen] = useState<boolean>(false)
    const [isIntentsPanelOpen, setIsIntentsPanelOpen] = useState<boolean>(false)
    const abortFuncs = useRef([] as AbortController[])
    const [showAuthMessage, setShowAuthMessage] = useState<boolean | undefined>()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [execResults, setExecResults] = useState<ExecResults[]>([])
    const [processMessages, setProcessMessages] = useState<messageStatus>(messageStatus.NotRunning)
    const [clearingChat, setClearingChat] = useState<boolean>(false)
    const [hideErrorDialog, { toggle: toggleErrorDialog }] = useBoolean(true)
    const [errorMsg, setErrorMsg] = useState<ErrorMessage | null>()

    
    const errorDialogContentProps = {
        type: DialogType.close,
        title: errorMsg?.title,
        closeButtonAriaLabel: 'Close',
        subText: errorMsg?.subtitle
      }
    
      const modalProps = {
        titleAriaId: 'labelId',
        subtitleAriaId: 'subTextId',
        isBlocking: true,
        styles: { main: { maxWidth: 450 } }
      }

    const [placeholderText, setPlaceholderText] = useState("Write your question here");
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [promptTemplate, setPromptTemplate] = useState<string>("");
    const [retrieveCount, setRetrieveCount] = useState<number>(3);
    const [useSemanticRanker, setUseSemanticRanker] = useState<boolean>(true);
    const [useSemanticCaptions, setUseSemanticCaptions] = useState<boolean>(false);
    const [excludeCategory, setExcludeCategory] = useState<string>("");
    const [useSuggestFollowupQuestions, setUseSuggestFollowupQuestions] = useState<boolean>(false);

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

      const handleErrorDialogClose = () => {
        toggleErrorDialog()
        setTimeout(() => {
          setErrorMsg(null)
        }, 500)
      }
    
      useEffect(() => {
        setIsLoading(appStateContext?.state.chatHistoryLoadingState === ChatHistoryLoadingState.Loading)
      }, [appStateContext?.state.chatHistoryLoadingState])
    
      const getUserInfoList = async () => {
        if (!AUTH_ENABLED) {
          setShowAuthMessage(false)
          return
        }
        const userInfoList = await getUserInfo()
        if (userInfoList.length === 0 && window.location.hostname !== '127.0.0.1') {
          setShowAuthMessage(true)
        } else {
          setShowAuthMessage(false)
        }
      }
      
      const [ASSISTANT, TOOL, ERROR] = ['assistant', 'tool', 'error']
  const NO_CONTENT_ERROR = 'No content in messages object.'

  let assistantMessage = {} as ChatMessage
  let toolMessage = {} as ChatMessage
  let assistantContent = ''

  // const processResultMessage = (resultMessage: ChatMessage, userMessage: ChatMessage, conversationId?: string) => {
  //   if (resultMessage.content.includes('all_exec_results')) {
  //     const parsedExecResults = JSON.parse(resultMessage.content) as AzureSqlServerExecResults
  //     setExecResults(parsedExecResults.all_exec_results)
  //   }

  //   if (resultMessage.role === ASSISTANT) {
  //     assistantContent += resultMessage.content
  //     assistantMessage = resultMessage
  //     assistantMessage.content = assistantContent

  //     if (resultMessage.context) {
  //       toolMessage = {
  //         id: uuid(),
  //         role: TOOL,
  //         content: resultMessage.context,
  //         date: new Date().toISOString()
  //       }
  //     }
  //   }

  //   if (resultMessage.role === TOOL) toolMessage = resultMessage

  //   if (!conversationId) {
  //     isEmpty(toolMessage)
  //       ? setMessages([...messages, userMessage, assistantMessage])
  //       : setMessages([...messages, userMessage, toolMessage, assistantMessage])
  //   } else {
  //     isEmpty(toolMessage)
  //       ? setMessages([...messages, assistantMessage])
  //       : setMessages([...messages, toolMessage, assistantMessage])
  //   }
  // }
    


    const lastQuestionRef = useRef<string>("");
    const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);
    const [fileType, setFileType] = useState<string>("");

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>();

    const [activeCitation, setActiveCitation] = useState<string>();
    const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<AnalysisPanelTabs | undefined>(undefined);

    const [selectedAnswer, setSelectedAnswer] = useState<number>(0);
    const [answers, setAnswers] = useState<[user: string, response: AskResponse][]>([]);

    const [userId, setUserId] = useState<string>("");
    const triggered = useRef(false);

    const makeApiRequestGpt = async (question: string) => {
        lastQuestionRef.current = question;

        error && setError(undefined);
        setIsLoading(true);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);

        try {
            const history: ChatTurn[] = answers.map(a => ({ user: a[0], bot: a[1].answer }));
            const request: ChatRequestGpt = {
                history: [...history, { user: question, bot: undefined }],
                approach: Approaches.ReadRetrieveRead,
                conversation_id: userId,
                query: question,
                overrides: {
                    promptTemplate: promptTemplate.length === 0 ? undefined : promptTemplate,
                    excludeCategory: excludeCategory.length === 0 ? undefined : excludeCategory,
                    top: retrieveCount,
                    semanticRanker: useSemanticRanker,
                    semanticCaptions: useSemanticCaptions,
                    suggestFollowupQuestions: useSuggestFollowupQuestions
                }
            };
            const result = await chatApiGpt(request);
            console.log(result);
            console.log(result.answer);
            setAnswers([...answers, [question, result]]);
            setUserId(result.conversation_id);

            // Voice Synthesis
            if (speechSynthesisEnabled) {
                const tokenObj = await getTokenOrRefresh();
                const speechConfig = SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
                const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
                speechConfig.speechSynthesisLanguage = tokenObj.speechSynthesisLanguage;
                speechConfig.speechSynthesisVoiceName = tokenObj.speechSynthesisVoiceName;
                const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

                synthesizer.speakTextAsync(
                    result.answer.replace(/ *\[[^)]*\] */g, ""),
                    function (result) {
                        if (result.reason === ResultReason.SynthesizingAudioCompleted) {
                            console.log("synthesis finished.");
                        } else {
                            console.error("Speech synthesis canceled, " + result.errorDetails + "\nDid you update the subscription info?");
                        }
                        synthesizer.close();
                    },
                    function (err) {
                        console.trace("err - " + err);
                        synthesizer.close();
                    }
                );
            }
        } catch (e) {
            setError(e);
        } finally {
            setIsLoading(false);
        }
    };

    // const clearChat = () => {
    //     // console.log("file is" + fileType);
    //     lastQuestionRef.current = "";
    //     error && setError(undefined);
    //     setActiveCitation(undefined);
    //     setActiveAnalysisPanelTab(undefined);
    //     setAnswers([]);
    //     setUserId("");
    //     setStarter("")
    // };
    const clearChat = async () => {
        setClearingChat(true)
        if (appStateContext?.state.currentChat?.id && appStateContext?.state.isCosmosDBAvailable.cosmosDB) {
          let response = await historyClear(appStateContext?.state.currentChat.id)
          if (!response.ok) {
            setErrorMsg({
              title: 'Error clearing current chat',
              subtitle: 'Please try again. If the problem persists, please contact the site administrator.'
            })
            toggleErrorDialog()
          } else {
            appStateContext?.dispatch({
              type: 'DELETE_CURRENT_CHAT_MESSAGES',
              payload: appStateContext?.state.currentChat.id
            })
            appStateContext?.dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: appStateContext?.state.currentChat })
            setActiveCitation(undefined)
            setIsCitationPanelOpen(false)
            setIsIntentsPanelOpen(false)
            setMessages([])
            lastQuestionRef.current = "";
            error && setError(undefined);
            setActiveCitation(undefined);
            setActiveAnalysisPanelTab(undefined);
            setAnswers([]);
            setUserId("");
          }
        }
        else{
            console.log("No lo se rick")
        }
        setClearingChat(false)
      }
    
      
  const newChat = () => {
    setProcessMessages(messageStatus.Processing)
    setMessages([])
    setIsCitationPanelOpen(false)
    setIsIntentsPanelOpen(false)
    setActiveCitation(undefined)
    appStateContext?.dispatch({ type: 'UPDATE_CURRENT_CHAT', payload: null })
    setProcessMessages(messageStatus.Done)
  }

  
  useEffect(() => {
    if (appStateContext?.state.currentChat) {
      setMessages(appStateContext.state.currentChat.messages)
    } else {
      setMessages([])
    }
  }, [appStateContext?.state.currentChat])

  useLayoutEffect(() => {
    const saveToDB = async (messages: ChatMessage[], id: string) => {
      const response = await historyUpdate(messages, id)
      return response
    }

    if (appStateContext && appStateContext.state.currentChat && processMessages === messageStatus.Done) {
      if (appStateContext.state.isCosmosDBAvailable.cosmosDB) {
        if (!appStateContext?.state.currentChat?.messages) {
          console.error('Failure fetching current chat state.')
          return
        }
        const noContentError = appStateContext.state.currentChat.messages.find(m => m.role === ERROR)

        if (!noContentError?.content.includes(NO_CONTENT_ERROR)) {
          saveToDB(appStateContext.state.currentChat.messages, appStateContext.state.currentChat.id)
            .then(res => {
              if (!res.ok) {
                let errorMessage =
                  "An error occurred. Answers can't be saved at this time. If the problem persists, please contact the site administrator."
                let errorChatMsg: ChatMessage = {
                  id: uuid(),
                  role: ERROR,
                  content: errorMessage,
                  date: new Date().toISOString()
                }
                if (!appStateContext?.state.currentChat?.messages) {
                  let err: Error = {
                    ...new Error(),
                    message: 'Failure fetching current chat state.'
                  }
                  throw err
                }
                setMessages([...appStateContext?.state.currentChat?.messages, errorChatMsg])
              }
              return res as Response
            })
            .catch(err => {
              console.error('Error: ', err)
              let errRes: Response = {
                ...new Response(),
                ok: false,
                status: 500
              }
              return errRes
            })
        }
      } else {
      }
      appStateContext?.dispatch({ type: 'UPDATE_CHAT_HISTORY', payload: appStateContext.state.currentChat })
      setMessages(appStateContext.state.currentChat.messages)
      setProcessMessages(messageStatus.NotRunning)
    }
  }, [processMessages])


  useEffect(() => {
    if (AUTH_ENABLED !== undefined) getUserInfoList()
  }, [AUTH_ENABLED])
    /**Get Pdf */
    const getPdf = async (pdfName: string) => {
        /** get file type */
        let type = getFileType(pdfName);
        setFileType(type);

        try {
            const response = await fetch("/api/get-blob", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    blob_name: pdfName
                })
            });

            if (!response.ok) {
                throw new Error(`Error fetching DOC: ${response.status}`);
            }

            return await response.blob();
        } catch (error) {
            console.error(error);
            throw new Error("Error fetching DOC.");
        }
    };

    useEffect(() => {
        chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" });
        if (triggered.current === false) {
            triggered.current = true;
            console.log(triggered.current);
        }
        // const language = navigator.language;
        // if (language.startsWith("pt")) {
        //     setPlaceholderText("Escreva aqui sua pergunta");
        // }
        // if (language.startsWith("es")) {
        //     setPlaceholderText("Escribe tu pregunta aqui");
        // } else {
        //     setPlaceholderText("Write your question here");
        // }
    }, [isLoading]);

    const onPromptTemplateChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setPromptTemplate(newValue || "");
    };

    const onRetrieveCountChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
        setRetrieveCount(parseInt(newValue || "3"));
    };

    const onUseSemanticRankerChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticRanker(!!checked);
    };

    const onUseSemanticCaptionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticCaptions(!!checked);
    };

    const onExcludeCategoryChanged = (_ev?: React.FormEvent, newValue?: string) => {
        setExcludeCategory(newValue || "");
    };

    const onUseSuggestFollowupQuestionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSuggestFollowupQuestions(!!checked);
    };

    const onExampleClicked = (example: string) => {
        makeApiRequestGpt(example);
    };

    const onShowCitation = async (citation: string, fileName: string, index: number) => {
        const response = await getPdf(fileName);
        if (activeCitation === citation && activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab && selectedAnswer === index) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            //var file = new Blob([response as BlobPart], { type: "application/pdf" });
            var file = new Blob([response as BlobPart]);

            readFile(file);

            function readFile(input: Blob) {
                const fr = new FileReader();
                fr.readAsDataURL(input);
                fr.onload = function (event) {
                    const res: any = event.target ? event.target.result : undefined;
                    setActiveCitation(res);
                };
            }
            setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
        }

        setSelectedAnswer(index);
    };

    // const onShowCitation = (citation: string, index: number) => {
    //     if (activeCitation === citation && activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab && selectedAnswer === index) {
    //         setActiveAnalysisPanelTab(undefined);
    //     } else {
    //         setActiveCitation(citation);
    //         setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
    //     }

    //     setSelectedAnswer(index);
    // };

    const onToggleTab = (tab: AnalysisPanelTabs, index: number) => {
        if (activeAnalysisPanelTab === tab && selectedAnswer === index) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveAnalysisPanelTab(tab);
        }

        setSelectedAnswer(index);
    };
    // const preguntas = [
    //     "¿Tenemos productos de pasarelas de pago?"
    //     ,"¿La compañía tiene soluciones para empresas facturadoras?"
    //     ,"¿Qué aplicaciones y servicios posee la compañía?"
    //     ,"¿Cómo puedo enviar dinero a otra persona usando ATH Móvil?"
    // ]

    const {starter, setStarter} = useContext(darkContext)

    const handleStarter = (start:string) =>{
        setStarter(start)
    }
    const {isDark,setIsDark} = useContext(darkContext)

    const {userLanguage,setLanguage} = useContext(darkContext)
    const [preguntas,setPreguntas] = useState([ "Do we have payment gateway products?",
        "Does the company have solutions for billing companies?",
        "What applications and services does the company have?",
        "What services are located in Brazil?"])
    const [error_message_text,setErrorMessage] = useState("I'm sorry, I had a problem with the request. Please report the error to the support team. ")

    useEffect(()=>{
        if (userLanguage === "es"){
            setErrorMessage("Lo siento, yo tuve un problema con la solicitud. Por favor informe el error al equipo de soporte. ")
            setPlaceholderText("Escribe tu pregunta aqui");
            setPreguntas([
                "¿Tenemos productos de pasarelas de pago?"
                ,"¿La compañía tiene soluciones para empresas facturadoras?"
                ,"¿Qué aplicaciones y servicios posee la compañía?"
                ,"¿Qué servicios están localizados en Brasil?"
            ])
        }
        else if (userLanguage ==="pt"){
            setErrorMessage("Desculpe, tive um problema técnico com a solicitação. Por favor informar o erro a equipe de suporte. ")
            setPlaceholderText("Escreva aqui sua pergunta");
            setPreguntas([
                "Temos produtos de gateway de pagamento?",
                "A empresa possui soluções para empresas de faturamento?",
                "Quais aplicações e serviços a empresa possui?",
                "Quais serviços estão localizados no Brasil?"
            ])
        }
        else if (userLanguage === "en"){
            setErrorMessage("I'm sorry, I had a problem with the request. Please report the error to the support team. ")
            setPlaceholderText("Write your question here");
            setPreguntas([ "Do we have payment gateway products?",
                "Does the company have solutions for billing companies?",
                "What applications and services does the company have?",
                "What services are located in Brazil?"])
        }
    },[userLanguage])
    


    return (
        <div className={`${isDark ? styles.wrapperContainer:styles.wrapperContainerDark }`}>

        <div className={`${isDark ? styles.container:styles.containerDark }`}>
            {/* <div className={styles.commandsContainer}>
                <ClearChatButton className={styles.commandButton} onClick={clearChat} disabled={!lastQuestionRef.current || isLoading} />
            </div> */}
            <div className={styles.chatRoot}>
                <div className={styles.chatContainer}>
                    {!lastQuestionRef.current ? (
                        <div className={styles.chatEmptyState}>
                            {/* <SparkleFilled fontSize={"120px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="Chat logo" /> */}
                            <h1 className={styles.chatEmptyStateTitle}>Products Navigator Copilot</h1>
                            {/* <h1 className={styles.chatEmptyStateTitle}>Dummy Text</h1>
                            <h1 className={styles.chatEmptyStateTitle}>Dummy Text</h1>
                            <h1 className={styles.chatEmptyStateTitle}>Dummy Text</h1>
                            <h1 className={styles.chatEmptyStateTitle}>Dummy Text</h1>
                            <h1 className={styles.chatEmptyStateTitle}>Dummy Text</h1>
                            <h1 className={styles.chatEmptyStateTitle}>Dummy Text</h1>
                            <h1 className={styles.chatEmptyStateTitle}>Dummy Text</h1>
                            <h1 className={styles.chatEmptyStateTitle}>Dummy Text</h1>
                            <h1 className={styles.chatEmptyStateTitle}>Dummy Text</h1>
                            <h1 className={styles.chatEmptyStateTitle}>Dummy Text</h1>
                            <h1 className={styles.chatEmptyStateTitle}>Dummy Text</h1> */}
                            
                            <div className={styles.conversationStartersOptions}>
                                    <div className={styles.conversationStarterOption} onClick={()=> handleStarter(preguntas[0])}>{preguntas[0]}</div>
                                    <div className={styles.conversationStarterOption} onClick={()=> handleStarter(preguntas[1])}>{preguntas[1]}</div>
                                    <div className={styles.conversationStarterOption} onClick={()=> handleStarter(preguntas[2])}>{preguntas[2]}</div>
                                    <div className={styles.conversationStarterOption} onClick={()=> handleStarter(preguntas[3])}>{preguntas[3]}</div>
                                </div>
                                {/* <div className={styles.conversationStartersOptions}>
                                    <div className={styles.conversationStarterOption}>{preguntas[0]}</div>
                                    <div className={styles.conversationStarterOption} >{preguntas[1]}</div>
                                    <div className={styles.conversationStarterOption} >{preguntas[2]}</div>
                                    <div className={styles.conversationStarterOption} >{preguntas[3]}</div>
                                </div> */}
                        </div>
                    ) : (
                        <div className={styles.chatMessageStream}>
                            {answers.map((answer, index) => (
                                <div key={index}>
                                    <UserChatMessage message={answer[0]} />
                                    <div className={styles.chatMessageGpt}>
                                        <Answer
                                            key={index}
                                            answer={answer[1]}
                                            isSelected={selectedAnswer === index && activeAnalysisPanelTab !== undefined}
                                            onCitationClicked={(c, n) => onShowCitation(c, n, index)}
                                            onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)}
                                            onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab, index)}
                                            onFollowupQuestionClicked={q => makeApiRequestGpt(q)}
                                            showFollowupQuestions={false}
                                            showSources={false}
                                        />
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <>
                                    <UserChatMessage message={lastQuestionRef.current} />
                                    <div className={styles.chatMessageGptMinWidth}>
                                        <AnswerLoading />
                                    </div>
                                </>
                            )}
                            {error ? (
                                <>
                                    <UserChatMessage message={lastQuestionRef.current} />
                                    <div className={styles.chatMessageGptMinWidth}>
                                        <AnswerError error={error_message_text + error.toString()} onRetry={() => makeApiRequestGpt(lastQuestionRef.current)} />
                                    </div>
                                </>
                            ) : null}
                            <div ref={chatMessageStreamEnd} />
                        </div>
                    )}

                    <div className={styles.chatInput}>
                        <ClearChatButton className={styles.commandButton} onClick={clearChat} disabled={!lastQuestionRef.current || isLoading} />
                        <QuestionInput clearOnSend placeholder={placeholderText} disabled={isLoading} onSend={question => makeApiRequestGpt(question)} />
                    </div>
                </div>

                {answers.length > 0 && fileType !== "" && activeAnalysisPanelTab && (
                    <AnalysisPanel
                        className={styles.chatAnalysisPanel}
                        activeCitation={activeCitation}
                        onActiveTabChanged={x => onToggleTab(x, selectedAnswer)}
                        citationHeight="810px"
                        answer={answers[selectedAnswer][1]}
                        activeTab={activeAnalysisPanelTab}
                        fileType={fileType}
                    />
                )}
                <Dialog
                  hidden={hideErrorDialog}
                  onDismiss={handleErrorDialogClose}
                  dialogContentProps={errorDialogContentProps}
                  modalProps={modalProps}></Dialog>

                <Panel
                    headerText="Configure answer generation"
                    isOpen={isConfigPanelOpen}
                    isBlocking={false}
                    onDismiss={() => setIsConfigPanelOpen(false)}
                    closeButtonAriaLabel="Close"
                    onRenderFooterContent={() => <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>Close</DefaultButton>}
                    isFooterAtBottom={true}
                >
                    <TextField
                        className={styles.chatSettingsSeparator}
                        defaultValue={promptTemplate}
                        label="Override prompt template"
                        multiline
                        autoAdjustHeight
                        onChange={onPromptTemplateChange}
                    />

                    <SpinButton
                        className={styles.chatSettingsSeparator}
                        label="Retrieve this many documents from search:"
                        min={1}
                        max={50}
                        defaultValue={retrieveCount.toString()}
                        onChange={onRetrieveCountChange}
                    />
                    <TextField className={styles.chatSettingsSeparator} label="Exclude category" onChange={onExcludeCategoryChanged} />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSemanticRanker}
                        label="Use semantic ranker for retrieval"
                        onChange={onUseSemanticRankerChange}
                    />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSemanticCaptions}
                        label="Use query-contextual summaries instead of whole documents"
                        onChange={onUseSemanticCaptionsChange}
                        disabled={!useSemanticRanker}
                    />
                    <Checkbox
                        className={styles.chatSettingsSeparator}
                        checked={useSuggestFollowupQuestions}
                        label="Suggest follow-up questions"
                        onChange={onUseSuggestFollowupQuestionsChange}
                    />
                </Panel>
            </div>
        </div>
        </div>
    );
};

export default Chat;
