
import React, { useState, useEffect } from 'react';
import IdeaForm from './components/IdeaForm';
import ResultDisplay from './components/ResultDisplay';
import Loader from './components/Loader';
import { generateCreativeContent } from './services/geminiService';
import type { IdeaType, SubType } from './types';
import { LANGUAGES } from './constants';

const App: React.FC = () => {
  const [idea, setIdea] = useState<string>('');
  const [ideaType, setIdeaType] = useState<IdeaType>('Song');
  const [subType, setSubType] = useState<SubType>('Regular');
  const [language, setLanguage] = useState<string>(LANGUAGES[0].value);
  
  const [generatedText, setGeneratedText] = useState<string>('');
  const [base64Audio, setBase64Audio] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for API key management
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState<boolean>(true);
  const [isApiKeySelectionLoading, setIsApiKeySelectionLoading] = useState<boolean>(false);

  // Function to check API key status
  const checkApiKeyStatus = async () => {
    // Assuming window.aistudio is globally available and typed externally as per guidelines
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setShowApiKeyPrompt(!hasKey);
    } else {
      // Fallback if aistudio API is not available (e.g., local development without AI Studio wrapper)
      // Assume API key is available via process.env.API_KEY if aistudio is not present
      console.warn("window.aistudio.hasSelectedApiKey is not available. Assuming API key is set via environment variable.");
      setShowApiKeyPrompt(false); 
    }
  };

  // Effect to check API key status on mount
  useEffect(() => {
    checkApiKeyStatus();
  }, []); // Run once on mount

  const handleSelectApiKey = async () => {
    // Assuming window.aistudio is globally available and typed externally as per guidelines
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      setIsApiKeySelectionLoading(true);
      try {
        await window.aistudio.openSelectKey();
        // Optimistically assume key selection was successful to avoid race conditions.
        setShowApiKeyPrompt(false);
      } catch (e) {
        console.error("Failed to open API key selection dialog:", e);
        setError("Failed to open API key selection dialog. Please try again.");
      } finally {
        setIsApiKeySelectionLoading(false);
      }
    } else {
      setError("API key selection utility (window.aistudio.openSelectKey) is not available.");
      console.error("window.aistudio.openSelectKey is not available.");
      // If aistudio is not present, we can't open the dialog, so we proceed assuming env var is set
      setShowApiKeyPrompt(false); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedText('');
    setBase64Audio(null);

    // First, check if an API key is selected.
    // This check is performed before `setIsLoading(true)` so the button doesn't look stuck.
    // Assuming window.aistudio is globally available and typed externally as per guidelines
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setShowApiKeyPrompt(true); // Ensure the prompt is visible
        setError("Please select an API key before generating content.");
        return; // Prevent further execution if no key is selected
      }
    } else {
      // If aistudio API is not available, proceed assuming API key is set via env var
      console.warn("window.aistudio.hasSelectedApiKey is not available. Proceeding with generation, assuming API key is set.");
    }

    setIsLoading(true);

    try {
      // CRITICAL: Create a new GoogleGenAI instance right before making an API call
      // to ensure it always uses the most up-to-date API key from the dialog.
      // Do not create GoogleGenAI when the component is first rendered.
      const selectedLanguage = LANGUAGES.find(lang => lang.value === language);
      if (!selectedLanguage) {
        throw new Error("Invalid language selected.");
      }

      const result = await generateCreativeContent(idea, ideaType, subType, selectedLanguage.value, selectedLanguage.voiceName);
      setGeneratedText(result.generatedText);
      setBase64Audio(result.base64Audio);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found.")) {
        setError("Your API key might be invalid or not properly configured. Please select your API key again.");
        setShowApiKeyPrompt(true); // Re-prompt for key selection
      } else if (err.message && err.message.includes("API Key (process.env.API_KEY) is missing")) {
        setError("API Key is missing. Please select your API key.");
        setShowApiKeyPrompt(true);
      }
      else {
        setError('An error occurred while generating content. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
      <div className="w-full max-w-3xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Creative Spark
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Turn your ideas into songs, stories, and narrations.
          </p>
        </header>

        <main className="w-full">
            {showApiKeyPrompt ? (
                <div className="bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 w-full space-y-4 animate-fade-in">
                    <h3 className="text-2xl font-bold text-yellow-300 text-center">API Key Required</h3>
                    <p className="text-gray-300 text-center">
                        To use this application and manage your usage costs, please select your Google Gemini API key.
                    </p>
                    <button
                        onClick={handleSelectApiKey}
                        disabled={isApiKeySelectionLoading}
                        className="w-full py-3 text-lg font-bold bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                    >
                        {isApiKeySelectionLoading ? 'Opening Key Selector...' : 'Select Your API Key'}
                    </button>
                    <p className="text-sm text-gray-400 text-center mt-4">
                        Charges may apply based on your API usage. Learn more about billing: <br/>
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ai.google.dev/gemini-api/docs/billing</a>
                    </p>
                </div>
            ) : (
                <>
                    <IdeaForm
                        idea={idea}
                        setIdea={setIdea}
                        ideaType={ideaType}
                        setIdeaType={setIdeaType}
                        subType={subType}
                        setSubType={setSubType}
                        language={language}
                        setLanguage={setLanguage}
                        handleSubmit={handleSubmit}
                        isLoading={isLoading}
                    />

                    {error && (
                        <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center animate-fade-in">
                        {error}
                        </div>
                    )}

                    <div className="mt-8">
                        {isLoading && <Loader />}
                        {!isLoading && generatedText && (
                        <ResultDisplay text={generatedText} base64Audio={base64Audio} ideaType={ideaType}/>
                        )}
                    </div>
                </>
            )}
        </main>
      </div>
    </div>
  );
};

export default App;