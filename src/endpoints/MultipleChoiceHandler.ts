import axios from "axios";
import { baseUrl, Ok, Err, type Response } from "./Config";

// ---------------------- REQUEST TYPES ----------------------

/**
 * Request DTO for MCQ answer submission
 * Used when a user submits answers to multiple choice questions
 */
export interface MCQSubmissionRequest {
    /**
     * The activity ID containing the MCQ section
     */
    activityId: number;

    /**
     * The section ID containing the MCQ questions
     */
    sectionId: number;

    /**
     * Map of question ID to user's selected answer
     * Example:
     * {
     *   "1": "Option B",
     *   "2": "Option A",
     *   "3": "Option C"
     * }
     */
    answers: Record<number, string>;
}

// ---------------------- RESPONSE TYPES ----------------------

/**
 * Individual question result from MCQ validation
 */
export interface QuestionResult {
    /**
     * Question ID
     */
    questionId: number;

    /**
     * Question text
     */
    question: string;

    /**
     * Whether the answer was correct
     */
    correct: boolean;

    /**
     * User's submitted answer
     */
    userAnswer: string;

    /**
     * The correct answer (only shown after submission)
     */
    correctAnswer: string;

    /**
     * Points for this question
     */
    points: number;

    /**
     * Points earned (0 if incorrect, points value if correct)
     */
    pointsEarned: number;
}

/**
 * Response DTO for MCQ validation results
 */
export interface MCQValidationResponse {
    /**
     * Overall success status - true if all questions answered correctly
     */
    success: boolean;

    /**
     * Total number of questions
     */
    totalQuestions: number;

    /**
     * Number of correct answers
     */
    correctAnswers: number;

    /**
     * Number of incorrect answers
     */
    incorrectAnswers: number;

    /**
     * Total points earned
     */
    pointsEarned: number;

    /**
     * Maximum possible points
     */
    maxPoints: number;

    /**
     * Percentage score (0-100)
     */
    scorePercentage: number;

    /**
     * Detailed results for each question
     */
    questionResults: QuestionResult[];
}

/**
 * MCQ Question entity from the backend
 */
export interface MCQQuestion {
    /**
     * Question ID
     */
    id: number;

    /**
     * Question index/order in section
     */
    idx: number;

    /**
     * Question text
     */
    question: string;

    /**
     * Points for this question
     */
    points: number;

    /**
     * JSON string of answer choices
     * Example: "[\"Option A: 3\", \"Option B: 4\", \"Option C: 5\", \"Option D: 6\"]"
     */
    choices: string;

    /**
     * The correct answer (included for now, consider hiding in production)
     */
    correctAnswer: string;
}

// ---------------------- API HANDLERS ----------------------

/**
 * Validate MCQ answers for a section
 * 
 * @param request MCQ submission with answers
 * @param jwt JWT authentication token
 * @returns Validation results with scores and feedback
 * 
 * Example response:
 * {
 *   "success": false,
 *   "totalQuestions": 3,
 *   "correctAnswers": 2,
 *   "incorrectAnswers": 1,
 *   "pointsEarned": 20,
 *   "maxPoints": 30,
 *   "scorePercentage": 66.67,
 *   "questionResults": [...]
 * }
 */
export async function validateMCQAnswers(
    request: MCQSubmissionRequest,
    jwt: string
): Promise<Response<MCQValidationResponse>> {
    try {
        const config: any = { headers: {} };
        if (jwt) config.headers["Authorization"] = `Bearer ${jwt}`;

        const response = await axios.post(
            `${baseUrl}/api/mcq/validate`,
            request,
            config
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error("MCQ validation error:", e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

/**
 * Get all questions for a section
 * Returns questions without revealing correct answers
 * 
 * @param sectionId Section ID containing MCQ questions
 * @param jwt JWT authentication token
 * @returns List of MCQ questions with choices
 * 
 * Example response:
 * [
 *   {
 *     "id": 1,
 *     "idx": 0,
 *     "question": "What is 2 + 2?",
 *     "points": 10,
 *     "choices": "[\"Option A: 3\", \"Option B: 4\", \"Option C: 5\", \"Option D: 6\"]",
 *     "correctAnswer": "Option B: 4"
 *   },
 *   ...
 * ]
 */
export async function getMCQQuestions(
    sectionId: number,
    jwt: string
): Promise<Response<MCQQuestion[]>> {
    try {
        const config: any = { headers: {} };
        if (jwt) config.headers["Authorization"] = `Bearer ${jwt}`;

        const response = await axios.get(
            `${baseUrl}/api/mcq/section/${sectionId}/questions`,
            config
        );

        if (response.status === 200) return Ok(response.data);
        return Err(response.data ?? "Unknown error");

    } catch (e: any) {
        console.error("MCQ questions retrieval error:", e);
        if (e.response) return Err(e.response.data ?? "Request failed");
        return Err("Network Error");
    }
}

// ---------------------- UTILITY FUNCTIONS ----------------------

/**
 * Parse choices JSON string into an array of choice strings
 * 
 * @param choicesJson JSON string of choices
 * @returns Array of choice strings
 */
export function parseChoices(choicesJson: string): string[] {
    try {
        return JSON.parse(choicesJson);
    } catch (e) {
        console.error("Error parsing choices JSON:", e);
        return [];
    }
}

/**
 * Calculate score percentage
 * 
 * @param earned Points earned
 * @param max Maximum points possible
 * @returns Score percentage (0-100)
 */
export function calculateScorePercentage(earned: number, max: number): number {
    if (max === 0) return 0;
    return Math.round((earned / max) * 100 * 100) / 100;
}

/**
 * Determine pass/fail status based on percentage
 * 
 * @param percentage Score percentage
 * @param passingPercentage Minimum percentage to pass (default 70)
 * @returns true if passed, false otherwise
 */
export function isPassed(percentage: number, passingPercentage: number = 70): boolean {
    return percentage >= passingPercentage;
}
