
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Tone, AspectRatio } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFacebookPost = async (prompt: string, tone: Tone): Promise<string> => {
  const model = 'gemini-2.5-flash';
  
  const fullPrompt = `Với vai trò là một chuyên gia quản lý mạng xã hội, hãy viết một bài đăng Facebook hấp dẫn về chủ đề sau: "${prompt}".
Văn phong cần phải ${tone}.
Bao gồm các hashtag liên quan và phù hợp.
Bài đăng phải thu hút và khuyến khích sự tương tác.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error(`Error generating Facebook post:`, error);
    throw new Error("Failed to generate post content.");
  }
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio, numberOfImages: number): Promise<string[]> => {
  const model = 'imagen-4.0-generate-001';
  
  try {
    const response = await ai.models.generateImages({
        model: model,
        prompt: prompt,
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio,
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
    }
    
    throw new Error("No image data found in the response.");
  } catch (error) {
    console.error(`Error generating image:`, error);
    throw new Error("Failed to generate image.");
  }
};

export const suggestImagePrompts = async (postContent: string): Promise<string[]> => {
  const model = 'gemini-2.5-flash';
  
  const prompt = `Dựa trên nội dung bài đăng Facebook sau, hãy tạo 3 mô tả hình ảnh độc đáo, sáng tạo và trực quan. 
Các mô tả này cần được tối ưu hóa cho một mô hình AI tạo ảnh như 'gemini-2.5-flash-image'.
Chỉ trả về một mảng JSON chứa 3 chuỗi mô tả ngắn gọn.

Nội dung bài đăng:
---
${postContent}
---`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });
    
    const jsonStr = response.text.trim();
    const suggestions = JSON.parse(jsonStr);
    
    if (Array.isArray(suggestions) && suggestions.every(item => typeof item === 'string')) {
        return suggestions;
    }
    
    throw new Error("Invalid format for suggestions received.");

  } catch (error) {
    console.error(`Error generating image prompt suggestions:`, error);
    throw new Error("Failed to generate image prompt suggestions.");
  }
};
