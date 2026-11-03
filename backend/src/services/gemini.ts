// import { GoogleGenAI } from "@google/genai";

// const apiKey = process.env.GEMINI_API_KEY;

// if (!apiKey) {
//   throw new Error("GEMINI_API_KEY is missing from environment variables");
// }

// const ai = new GoogleGenAI({ apiKey });

// export async function generateResponse(message: string): Promise<string> {
//   const response = await ai.models.generateContent({
//     model: "gemini-3.5-flash-lite",
//     contents: message,
//   });

//   const text = response.text;

//   if (!text) {
//     throw new Error("Gemini returned an empty response");
//   }

//   return text;
// }

import { GoogleGenAI } from "@google/genai";
import { ApiError } from "../errors/api-error";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing from environment variables");
}

const ai = new GoogleGenAI({ apiKey });

const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 30_000;
export async function generateResponse(message: string): Promise<string> {
  let text: string | undefined;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: message,
      config: { abortSignal: AbortSignal.timeout(TIMEOUT_MS) },
    });
    text = response.text;
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");

    console.error(
      "Gemini request failed:",
      error instanceof Error ? error.message : error,
    );

    throw new ApiError({
      code: timedOut ? "GATEWAY_TIMEOUT" : "BAD_GATEWAY",
      message: timedOut
        ? "The AI took too long to respond. Please try again."
        : "The AI service is unavailable. Please try again.",
    });
  }

  if (!text) {
    throw new ApiError({
      code: "BAD_GATEWAY",
      message: "The AI returned an empty response. Please try again.",
    });
  }

  return text;
}
