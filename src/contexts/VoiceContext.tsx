import { createContext, ReactNode, useContext, useState } from 'react';

const VoiceContext = createContext({
  isListening: false,
  transcript: '',
  isSupported: false,
  toggleListening: () => {},
  stopListening: () => {},
  clearTranscript: () => {},
});

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  return (
    <VoiceContext.Provider
      value={{
        isListening,
        transcript,
        isSupported: false,
        toggleListening: () => setIsListening((value) => !value),
        stopListening: () => setIsListening(false),
        clearTranscript: () => setTranscript(''),
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  return useContext(VoiceContext);
}
