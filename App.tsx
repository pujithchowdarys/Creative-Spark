
import React, { useState } from 'react';
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
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyEntered, setIsApiKeyEntered] = useState<boolean>(false);
  const [apiKeyInputError, setApiKeyInputError] = useState<string | null>(null);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKeyInputError(null);
    if (apiKey.trim() === '') {
      setApiKeyInputError("API Key cannot be empty.");
      return;
    }
    setIsApiKeyEntered(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedText('');
    setBase64Audio(null);

    if (!isApiKeyEntered || apiKey.trim() === '') {
      setError("Please enter and save your API key first.");
      setIsApiKeyEntered(false); // Go back to API key input form
      return;
    }

    setIsLoading(true);

    try {
      const selectedLanguage = LANGUAGES.find(lang => lang.value === language);
      if (!selectedLanguage) {
        throw new Error("Invalid language selected.");
      }

      const result = await generateCreativeContent(apiKey, idea, ideaType, subType, selectedLanguage.value, selectedLanguage.voiceName);
      setGeneratedText(result.generatedText);
      setBase64Audio(result.base64Audio);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found.")) {
        setError("Your API key might be invalid or not properly configured. Please re-enter your API key.");
        setIsApiKeyEntered(false); // Re-prompt for key entry
        setApiKey(''); // Clear the invalid key
      } else if (err.message && err.message.includes("API Key is missing")) {
        setError("API Key is missing. Please enter your API key.");
        setIsApiKeyEntered(false); // Re-prompt for key entry
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
            {!isApiKeyEntered ? (
                <div className="bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 w-full space-y-4 animate-fade-in">
                    <h3 className="text-2xl font-bold text-yellow-300 text-center mb-4">Enter Your Google Gemini API Key</h3>
                    
                    {/* API Key Instructions */}
                    <div className="bg-gray-700/50 p-4 rounded-lg space-y-3 mb-6">
                        <h4 className="text-xl font-bold text-yellow-200">How to get your Google Gemini API Key:</h4>
                        <ol className="list-decimal list-inside text-gray-300 space-y-2">
                            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google AI Studio API Key page</a>.</li>
                            <li>If prompted, sign in with your Google account.</li>
                            <li>Create a new project or select an existing one.</li>
                            <li>Click "Create API key in new project" (or locate an existing key).</li>
                            <li>Copy the generated API key and paste it below.</li>
                        </ol>
                    </div>

                    <p className="text-gray-300 text-center">
                        To use this application, please provide your Google Gemini API key. This helps you manage your own usage and associated billing.
                    </p>
                    <form onSubmit={handleApiKeySubmit} className="space-y-4">
                        <input
                            type="password" // Use type="password" for sensitive info, but user can change to text to see it.
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Paste your API key here (e.g., AIzaSy...)"
                            className="w-full p-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors duration-300 text-white"
                            required
                        />
                        {apiKeyInputError && (
                            <p className="text-red-400 text-sm text-center">{apiKeyInputError}</p>
                        )}
                        <button
                            type="submit"
                            className="w-full py-3 text-lg font-bold bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-300 transform hover:scale-105"
                        >
                            Save Key and Start Creating
                        </button>
                    </form>
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