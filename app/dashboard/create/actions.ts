"use server";

import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Initialize Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Zod schema for validating the lesson plan structure
const lessonPlanSchema = z.object({
  topic: z.string(),
  subtopic: z.string(),
  duration: z.string(),
  studentLevel: z.string(),
  objective: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      duration: z.string(),
    })
  ),
});

// Define the shape of the incoming data
interface LessonPlanInput {
  topic: string;
  subtopic: string;
  duration: string;
  studentLevel: string;
  objective: string;
}

// Server-side action to create a lesson plan
export async function CreateLessonPlan(formData: LessonPlanInput) {
  const { topic, subtopic, duration, studentLevel, objective } = formData;

  try {
    // Authenticate the user using Clerk
    const { userId } = auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Fetch user data from Prisma database
    const userDB = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userDB) {
      throw new Error("User not found.");
    }

    // Get the generative model from Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prompt for Gemini to generate the lesson plan
    const prompt = `
      As an expert in education and curriculum development, create a comprehensive and detailed lesson plan for teachers, professionals, and PhD-level educators. The lesson plan should be structured as follows:

      Topic: ${topic}
      Subtopic: ${subtopic}
      Total Duration: ${duration} minutes
      Student Level: ${studentLevel}
      Primary Objective: ${objective}

      Please provide a lesson plan that includes:
      1. Introduction (2-3 sentences)
      2. Learning outcomes (3-5 bullet points)
      3. Materials and resources
      4. Lesson breakdown into sections:
         - Section title
         - Duration
         - Content
         - Methods
      5. Assessment strategies
      6. Summary
      Ensure that the total duration does not exceed ${duration} minutes.

      **Instructions:**
      - Format the response strictly as a valid JSON object.
      - Do **not** include any explanations, comments, or additional text outside the JSON.
      - Example format:
        {
          "topic": "Topic Name",
          "subtopic": "Subtopic Name",
          ...
        }
    `;

    // Generate content using the Gemini AI model
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Log the entire response for debugging
    console.log("Gemini API full response:", JSON.stringify(result, null, 2));

    const response = result.response;
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No valid response from Gemini.");
    }

    // Check if the content and parts are defined
    const candidate = response.candidates[0];
    if (
      !candidate.content ||
      !candidate.content.parts ||
      candidate.content.parts.length === 0
    ) {
      throw new Error("Invalid response structure from Gemini.");
    }

    const lessonPlanText = candidate.content.parts[0].text;
    if (!lessonPlanText) {
      throw new Error("Empty response from Gemini.");
    }

    let lessonPlan;

    try {
      // Attempt to parse the JSON response
      lessonPlan = JSON.parse(lessonPlanText);

      // Validate the lesson plan using the Zod schema
      const validatedLessonPlan = lessonPlanSchema.parse(lessonPlan);

      // Store the lesson plan in the Prisma database
      const lessonPlanDB = await prisma.lessonPlan.create({
        data: {
          ...validatedLessonPlan,
          userId: userDB.id,
          title: validatedLessonPlan.topic,
          subject: validatedLessonPlan.subtopic,
          duration: parseInt(validatedLessonPlan.duration, 10),
          sections: {
            create: validatedLessonPlan.sections.map((section) => ({
              ...section,
              duration: parseInt(section.duration, 10),
            })),
          },
        },
      });

      // Revalidate the cache for the dashboard/course path
      revalidatePath("/dashboard/course");

      // Return success response
      return { success: true, lessonPlan: lessonPlanDB };
    } catch (parseError) {
      console.error("Failed to parse or validate Gemini response:", parseError);
      console.log("Raw Gemini response:", lessonPlanText);

      // Attempt to extract JSON from the response if it's not properly formatted
      const jsonMatch = lessonPlanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          lessonPlan = JSON.parse(jsonMatch[0]);
          const validatedLessonPlan = lessonPlanSchema.parse(lessonPlan);

          // If we successfully extracted and validated JSON, proceed with saving
          const lessonPlanDB = await prisma.lessonPlan.create({
            data: {
              ...validatedLessonPlan,
              userId: userDB.id,
              title: validatedLessonPlan.topic,
              subject: validatedLessonPlan.subtopic,
              duration: parseInt(validatedLessonPlan.duration, 10),
              sections: {
                create: validatedLessonPlan.sections.map((section) => ({
                  ...section,
                  duration: parseInt(section.duration, 10),
                })),
              },
            },
          });

          revalidatePath("/dashboard/course");
          return { success: true, lessonPlan: lessonPlanDB };
        } catch (extractError) {
          console.error("Failed to extract and validate JSON:", extractError);
        }
      }

      // If all attempts fail, throw a more descriptive error
      throw new Error(
        "Failed to parse or validate the Gemini response. The AI might have generated an invalid format."
      );
    }
  } catch (error) {
    console.error("Error in CreateLessonPlan:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unknown error occurred while creating the lesson plan.",
    };
  }
}
