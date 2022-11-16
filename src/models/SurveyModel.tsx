export interface SurveyModel {
    surveyId: string;
    surveyName: string;
    max: number;
    min: number;
    introPrompt: string;
    outroPrompt: string;
    questions: string[];
    flags: number[];
}