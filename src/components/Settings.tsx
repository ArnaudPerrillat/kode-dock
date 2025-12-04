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

const themes: Array<{ value: Theme; label: string; description: string }> = [
  {
    value: "light",
    label: "Light",
    description: "Light theme for daytime use",
  },
  { value: "dark", label: "Dark", description: "Dark theme for nighttime use" },
  {
    value: "system",
    label: "System",
    description: "Follow system theme preference",
  },
];

export function Settings({
  defaultIDE,
  theme,
  onIDEChange,
  onThemeChange,
}: SettingsProps) {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your preferences for KodeDock
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </CardTitle>
            <CardDescription className="text-xs">
              Choose your preferred color theme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => onThemeChange(themeOption.value)}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors text-left ${
                    theme === themeOption.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-border hover:border-blue-300 hover:bg-accent"
                  }`}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {themeOption.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {themeOption.description}
                    </div>
                  </div>
                  {theme === themeOption.value && (
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 ml-4" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Default IDE
            </CardTitle>
            <CardDescription className="text-xs">
              Choose which IDE or editor to use when opening projects
            </CardDescription>
          </CardHeader>
          <CardContent>
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
  );
}
