export type ThemePrefs = {
  mode: "dark" | "light";
  accent: string;       // hex color, e.g. #22d3ee
  background: string;   // hex color
  bubbleUser: string;   // hex color — user ke chat bubble ka background
  bubbleAssistant: string; // hex color — AI ke chat bubble ka background
};

export const DEFAULT_THEME: ThemePrefs = {
  mode: "dark",
  accent: "#22d3ee",
  background: "#050709",
  bubbleUser: "#151a23",
  bubbleAssistant: "#0b0e14",
};

export type Visibility = "public" | "private";
