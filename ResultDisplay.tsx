import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DownloadIcon } from './icons';
import { decode, decodePcmToAudioBuffer, createWavBlob } from '../utils/audioUtils';
import { SPEAKER_VOICES } from '../constants';
import { generateAudioFromText } from '../services/geminiService';
import type { IdeaType, Dialogue, CreativeContentOutput } from '../types'; // Import CreativeContentOutput

interface ResultDisplayProps {
  generatedContent: CreativeContentOutput | null; // Updated prop type
  ideaType: IdeaType;
  apiKey: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ generatedContent, ideaType, apiKey }) => {
  const [currentAudioBase64, setCurrentAudioBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(SPEAKER_VOICES[0].value);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize AudioContext only once
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  }, []);

  // Effect to handle audio playback and cleanup
  useEffect(() => {
    if (!audioContextRef.current || !currentAudioBase64) return;

    let isMounted = true;
    const decodedPcm = decode(currentAudioBase64);
    decodePcmToAudioBuffer(decodedPcm, audioContextRef.current, 24000, 1)
      .then(audioBuffer => {
        if (isMounted) {
          const source = audioContextRef.current!.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current!.destination);
          audioSourceRef.current = source;
          source.onended = () => setIsPlaying(false);
        }
      })
      .catch(error => {
        if (isMounted) console.error("Error decoding audio data:", error);
      });

    return () => {
      isMounted = false;
      audioSourceRef.current?.stop();
      audioSourceRef.current?.disconnect();
      audioSourceRef.current = null;
    };
  }, [currentAudioBase64]);


  // Helper to format content for display and text download (now includes moral)
  const formattedContentForTextAndAudio = useMemo(() => {
    if (!generatedContent) return '';

    let mainText = '';
    if (ideaType === 'Narration / Description' && typeof generatedContent.mainContent !== 'string') {
      const dialogueContent = generatedContent.mainContent as Dialogue;
      if (dialogueContent.title) {
        mainText += `Title: ${dialogueContent.title}\n\n`;
      }
      mainText += dialogueContent.dialogue.map(part => `${part.speaker}: ${part.line}`).join('\n\n');
    } else {
      mainText = generatedContent.mainContent as string;
    }

    // Append the moral to the formatted content
    return `${mainText}\n\n--- Moral of the Story ---\n${generatedContent.moral}`;
  }, [generatedContent, ideaType]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioSourceRef.current?.stop();
      setIsPlaying(false);
    } else {
      if (audioSourceRef.current && audioContextRef.current) {
        // Re-create the source node if it has already been played
        if (audioSourceRef.current.buffer) {
          const newSource = audioContextRef.current.createBufferSource();
          newSource.buffer = audioSourceRef.current.buffer;
          newSource.connect(audioContextRef.current.destination);
          newSource.onended = () => setIsPlaying(false);
          newSource.start();
          audioSourceRef.current = newSource;
          setIsPlaying(true);
        }
      }
    }
  };

  const handleDownloadText = () => {
    if (!formattedContentForTextAndAudio) return;
    const blob = new Blob([formattedContentForTextAndAudio], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ideaType.toLowerCase().replace(/ /g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = () => {
    if (currentAudioBase64) {
      const pcmData = decode(currentAudioBase64);
      const blob = createWavBlob(pcmData, 24000, 1, 16);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voiceover-${selectedVoiceName}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleGenerateAudio = async () => {
    if (!formattedContentForTextAndAudio) {
      setAudioError("No text content available to generate audio.");
      return;
    }
    setAudioLoading(true);
    setAudioError(null);
    setCurrentAudioBase64(null); // Clear previous audio
    setIsPlaying(false); // Stop any ongoing playback

    try {
      // Use the combined content for audio generation
      const base64Audio = await generateAudioFromText(apiKey, formattedContentForTextAndAudio, selectedVoiceName);
      setCurrentAudioBase64(base64Audio);
    } catch (err: any) {
      console.error("Error generating audio:", err);
      setAudioError(`Failed to generate audio: ${err.message || 'Unknown error'}`);
    } finally {
      setAudioLoading(false);
    }
  };
  
  if (!generatedContent) return null; // Render nothing if no content

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 w-full space-y-6 animate-fade-in">
      <div>
        <h3 className="text-2xl font-bold text-purple-300 mb-4">Generated Content</h3>
        <div className="bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono text-gray-300">
          {ideaType === 'Narration / Description' && typeof generatedContent.mainContent !== 'string' ? (
            <>
              {generatedContent.mainContent.title && <p className="text-xl font-bold mb-4">{generatedContent.mainContent.title}</p>}
              {(generatedContent.mainContent as Dialogue).dialogue.map((part, index) => (
                <p key={index} className="mb-2">
                  <span className="font-semibold text-purple-200">{part.speaker}:</span> {part.line}
                </p>
              ))}
            </>
          ) : (
            <>{generatedContent.mainContent as string}</>
          )}
        </div>
        
        {/* Moral of the Story Section */}
        {generatedContent.moral && (
          <div className="mt-6 p-4 bg-gray-900/50 border-l-4 border-purple-500 rounded-lg">
            <h4 className="text-lg font-semibold text-purple-300 mb-2">Moral of the Story:</h4>
            <p className="text-gray-300 italic">{generatedContent.moral}</p>
          </div>
        )}

        <button
          onClick={handleDownloadText}
          className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-900"
        >
          <DownloadIcon />
          Download Text
        </button>
      </div>

      {generatedContent && (
        <div>
          <h3 className="text-2xl font-bold text-purple-300 mb-4">Voiceover Options</h3>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <select
              value={selectedVoiceName}
              onChange={(e) => setSelectedVoiceName(e.target.value)}
              className="w-full sm:w-auto p-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-300 text-white"
            >
              {SPEAKER_VOICES.map((voice) => (
                <option key={voice.value} value={voice.value}>{voice.label}</option>
              ))}
            </select>
            <button
              onClick={handleGenerateAudio}
              disabled={audioLoading}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {audioLoading ? 'Generating Audio...' : 'Generate Voiceover'}
            </button>
          </div>
          {audioError && <p className="text-red-400 mt-2 text-sm">{audioError}</p>}

          {currentAudioBase64 && !audioLoading && (
            <div className="flex items-center space-x-4 mt-4 animate-fade-in">
              <button
                onClick={handlePlayPause}
                className="px-6 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition-colors duration-300 text-lg"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={handleDownloadAudio}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
              >
                <DownloadIcon />
                Download Audio
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;