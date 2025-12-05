import { Code2, Check, Palette } from "lucide-react";
import { IDE, Theme } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SettingsProps {
  defaultIDE: IDE;
  theme: Theme;
  onIDEChange: (ide: IDE) => void;
  onThemeChange: (theme: Theme) => void;
}

const IDEs: Array<{ value: IDE; label: string; description: string }> = [
  {
    value: "vscode",
    label: "Visual Studio Code",
    description: "Microsoft's popular code editor",
  },
  { value: "cursor", label: "Cursor", description: "AI-first code editor" },
  {
    value: "webstorm",
    label: "WebStorm",
    description: "JetBrains IDE for web development",
  },
  {
    value: "intellij",
    label: "IntelliJ IDEA",
    description: "JetBrains IDE for Java and more",
  },
  {
    value: "sublime",
    label: "Sublime Text",
    description: "Sophisticated text editor",
  },
  {
    value: "atom",
    label: "Atom",
    description: "Hackable text editor by GitHub",
  },
  {
    value: "notepad++",
    label: "Notepad++",
    description: "Windows text and source code editor",
  },
];

const themes: Array<{
  value: Theme;
  label: string;
  description: string;
  colors: { bg: string; text: string; accent: string };
}> = [
  {
    value: "light",
    label: "Light",
    description: "Light theme for daytime use",
    colors: { bg: "#ffffff", text: "#000000", accent: "#f0f0f0" },
  },
  {
    value: "dark",
    label: "Dark",
    description: "Dark theme for nighttime use",
    colors: { bg: "#0a0a0a", text: "#ffffff", accent: "#1a1a1a" },
  },
  {
    value: "system",
    label: "System",
    description: "Follow system theme preference",
    colors: {
      bg: "linear-gradient(135deg, #ffffff 50%, #0a0a0a 50%)",
      text: "#000000",
      accent: "#f0f0f0",
    },
  },
];

export function Settings({
  defaultIDE,
  theme,
  onIDEChange,
  onThemeChange,
}: SettingsProps) {
  return (
    <div className="overflow-y-auto h-full w-full">
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your preferences for KodeDock
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Theme
              </CardTitle>
              <CardDescription className="text-xs">
                Choose your preferred color theme
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-3 gap-4">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => onThemeChange(themeOption.value)}
                    className={`flex flex-col p-4 rounded-lg border-2 transition-colors text-left w-full ${
                      theme === themeOption.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-border hover:border-blue-300 hover:bg-accent"
                    }`}
                  >
                    <div className="relative mb-3 w-full">
                      <div
                        className="w-full h-20 rounded-md border border-border overflow-hidden shadow-sm"
                        style={{
                          background: themeOption.colors.bg,
                        }}
                      >
                        <div className="flex flex-col h-full p-2 gap-1">
                          <div
                            className="h-2 w-full rounded"
                            style={{
                              backgroundColor: themeOption.colors.accent,
                            }}
                          ></div>
                          <div
                            className="h-2 w-full rounded"
                            style={{
                              backgroundColor: themeOption.colors.accent,
                            }}
                          ></div>
                          <div
                            className="h-2 w-4/5 rounded mt-auto"
                            style={{
                              backgroundColor: themeOption.colors.accent,
                            }}
                          ></div>
                        </div>
                      </div>
                      {theme === themeOption.value && (
                        <div className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium">
                      {themeOption.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {themeOption.description}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="px-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Default IDE
              </CardTitle>
              <CardDescription className="text-xs">
                Choose which IDE or editor to use when opening projects
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid gap-3">
                {IDEs.map((ide) => (
                  <button
                    key={ide.value}
                    onClick={() => onIDEChange(ide.value)}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors text-left ${
                      defaultIDE === ide.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-border hover:border-blue-300 hover:bg-accent"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{ide.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {ide.description}
                      </div>
                    </div>
                    {defaultIDE === ide.value && (
                      <Check className="h-5 w-5 text-blue-600 flex-shrink-0 ml-4" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
