
import { GoogleGenAI, Modality } from "@google/genai";
import type { IdeaType, SubType } from '../types';

const createPrompt = (idea: string, type: IdeaType, subType: SubType, language: string): string => {
    let prompt = '';
    const audience = subType === 'Kids' ? 'for young children' : 'for a general audience';
    const languageInstruction = ` in the ${language} language`;

    switch (type) {
        case 'Song':
            prompt = `Write lyrics for a ${subType.toLowerCase()} song ${audience}${languageInstruction} based on this idea: "${idea}". The lyrics should have a clear structure with verses and a chorus.`;
            break;
        case 'Story':
            prompt = `Write a ${subType.toLowerCase()} story ${audience}${languageInstruction} based on this idea: "${idea}". The story should be engaging, with a beginning, middle, and end.`;
            if (subType === 'Kids') {
                prompt += ' Make it a wonderful bedtime story.';
            }
            break;
        case 'Narration / Description':
            prompt = `Create a detailed and engaging narration script describing the following idea: "${idea}"${languageInstruction}. The tone should be informative and captivating.`;
            break;
    }
    return prompt;
}

export const generateCreativeContent = async (
    apiKey: string, // API Key is now passed as an argument
    idea: string,
    type: IdeaType,
    subType: SubType,
    language: string,
    voiceName: string
) => {
    if (!apiKey) {
        throw new Error("API Key is missing. Please enter your API key to proceed.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // 1. Generate Text Content
    const textPrompt = createPrompt(idea, type, subType, language);
    const textResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textPrompt,
    });
    const generatedText = textResponse.text;

    if (!generatedText) {
        throw new Error("Failed to generate text content.");
    }
    
    // 2. Generate Audio Content from the text
    const audioResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: generatedText }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName },
                },
            },
        },
    });

    const base64Audio = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
        throw new Error("Failed to generate audio content.");
    }

    return { generatedText, base64Audio };
}