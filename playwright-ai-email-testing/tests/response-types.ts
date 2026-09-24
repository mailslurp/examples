//<gen>playwright_ai_response_types
export type Inbox = { id: string; emailAddress: string };
export type Evaluation = {
  evaluationId: string; successful: boolean; status: string; summary: string;
  data: { code: string } | null;
  extractionEvidence: Record<string, { field: string; text: string }[]>;
  usage: { tokens: number; complete: boolean; reservedTokens: number };
};
//</gen>
