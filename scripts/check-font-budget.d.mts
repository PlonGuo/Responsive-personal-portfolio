export interface FontMeasurement {
  path: string;
  requests: string[];
  fonts: Array<{ url: string; bytes: number }>;
  usedFonts: Array<{ familyName: string; isCustomFont: boolean; glyphCount: number }>;
  failedFonts?: string[];
}
export const FONT_BUDGET_BYTES: number;
export function assessFontBudget(record: FontMeasurement, baseURL: string, budget?: number): FontMeasurement & {
  budget: number; total: number; errors: string[];
};
export function measureFontBudget(baseURL: string, budget?: number): Promise<Array<ReturnType<typeof assessFontBudget>>>;
