import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { IdeaType, SubType, Dialogue, CreativeContentOutput } from '../types'; // Import CreativeContentOutput

// Helper function to create prompt and config for content generation
const createPromptAndConfig = (idea: string, type: IdeaType, subType: SubType, language: string) => {
    let prompt = '';
    const audience = subType === 'Kids' ? 'for young children' : 'for adults';
    const languageInstruction = ` in the ${language} language`;
    let config: any = { // All outputs will now be JSON
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                mainContent: { type: Type.STRING, description: 'The main generated content (e.g., song lyrics, story text, or serialized dialogue).' },
                moral: { type: Type.STRING, description: 'A concise moral or key takeaway from the generated content.' },
            },
            required: ["mainContent", "moral"],
            propertyOrdering: ["mainContent", "moral"],
        }
    };

    // Instruction for blending English words if the selected language is not English
    const englishBlendInstruction = (language !== 'English') 
        ? ` Please incorporate common English words or phrases where they naturally fit and enhance understanding, especially for a modern audience or kids.` 
        : '';

    switch (type) {
        case 'Song':
            prompt = `Write lyrics for a ${subType.toLowerCase()} song ${audience}${languageInstruction} based on this idea: "${idea}". The lyrics should have a clear structure with verses and a chorus. ${englishBlendInstruction} Provide the lyrics as 'mainContent' and a short 'moral' or theme of the song.`;
            break;
        case 'Story':
            prompt = `Write a ${subType.toLowerCase()} story ${audience}${languageInstruction} based on this idea: "${idea}". The story should be engaging, with a beginning, middle, and a satisfying, conclusive end. ${englishBlendInstruction} Provide the story text as 'mainContent' and a short 'moral' of the story.`;
            if (subType === 'Kids') {
                prompt += ' Make it a wonderful bedtime story.';
            }
            break;
        case 'Narration / Description':
            prompt = `Create a detailed and engaging conversation script based on this idea: "${idea}" ${languageInstruction}. The conversation should involve 2-3 distinct speakers (e.g., 'Person 1', 'Person 2', 'Person 3') with clear dialogue. Focus on informative and captivating dialogue that concludes with a natural, resolved ending. ${englishBlendInstruction} Provide the conversation as 'mainContent' (formatted as a JSON object with 'title' and 'dialogue' properties) and a short 'moral' or key takeaway from the conversation.`;
            // Override general schema for Narration/Description
            config.responseSchema.properties.mainContent = { // mainContent is now an object, not string
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: 'Optional title for the dialogue.' },
                    dialogue: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                speaker: { type: Type.STRING, description: 'The name of the speaker (e.g., Person 1, Narrator).' },
                                line: { type: Type.STRING, description: 'The spoken line of the speaker.' },
                            },
                            propertyOrdering: ["speaker", "line"],
                        },
                        description: 'An array of dialogue parts, each with a speaker and their line.',
                    },
                },
                required: ["dialogue"], // Dialogue array is required for conversation
                propertyOrdering: ["title", "dialogue"],
            };
            // Ensure the main outer object schema is still for the CreativeContentOutput
            config.responseSchema = {
                type: Type.OBJECT,
                properties: {
                    mainContent: config.responseSchema.properties.mainContent, // This is the dialogue JSON structure
                    moral: { type: Type.STRING, description: 'A concise moral or key takeaway from the generated content.' },
                },
                required: ["mainContent", "moral"],
                propertyOrdering: ["mainContent", "moral"],
            };
            break;
    }
    return { prompt, config };
}

export const generateCreativeContent = async (
    apiKey: string, // API Key is now passed as an argument
    idea: string,
    type: IdeaType,
    subType: SubType,
    language: string,
): Promise<{ generatedContent: CreativeContentOutput }> => { // Changed return type to CreativeContentOutput
    if (!apiKey) {
        throw new Error("API Key is missing. Please enter your API key to proceed.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // 1. Generate Text Content
    const { prompt: textPrompt, config: textGenConfig } = createPromptAndConfig(idea, type, subType, language);
    
    const generateContentParams: any = { // Use 'any' to allow dynamic config
        model: 'gemini-2.5-flash',
        contents: textPrompt,
    };
    if (Object.keys(textGenConfig).length > 0) {
        generateContentParams.config = textGenConfig;
    }

    const textResponse = await ai.models.generateContent(generateContentParams);
    
    let parsedOutput: CreativeContentOutput;
    try {
        // Remove markdown formatting like ```json ... ``` if present
        const jsonString = textResponse.text.trim().replace(/^```json\n|\n```$/g, '');
        const rawOutput = JSON.parse(jsonString);

        if (type === 'Narration / Description') {
            parsedOutput = {
                mainContent: rawOutput.mainContent as Dialogue, // Cast to Dialogue
                moral: rawOutput.moral as string,
            };
        } else {
            parsedOutput = {
                mainContent: rawOutput.mainContent as string, // For Song and Story, mainContent is a string
                moral: rawOutput.moral as string,
            };
        }
    } catch (e) {
        console.error("Failed to parse JSON response:", e);
        throw new Error("Model response was not valid JSON. Please try again or refine your idea.");
    }

    if (!parsedOutput.mainContent || !parsedOutput.moral) {
        throw new Error("Failed to generate complete content (main content or moral missing).");
    }
    
    return { generatedContent: parsedOutput };
}

export const generateAudioFromText = async (
    apiKey: string,
    textToSpeak: string,
    voiceName: string
) => {
    if (!apiKey) {
        throw new Error("API Key for audio generation is missing.");
    }
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const audioResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: textToSpeak }] }],
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
    return base64Audio;
}