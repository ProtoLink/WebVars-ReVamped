import { useRef, useState } from "react";
import { FileJson, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ImportVariablesFormProps {
  onSubmit: (definitions: unknown[]) => Promise<void>;
  isLoading?: boolean;
}

const exampleImport = `[
  {
    "name": "MyApp.Score",
    "defaultValue": "0",
    "scope": "private",
    "isReadOnly": false,
    "allowAnyone": false
  }
]`;

export function ImportVariablesForm({
  onSubmit,
  isLoading = false,
}: ImportVariablesFormProps) {
  const [json, setJson] = useState(exampleImport);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importDefinitions = async () => {
    setError(null);

    try {
      const parsed = JSON.parse(json);
      const definitions = Array.isArray(parsed) ? parsed : parsed?.definitions;

      if (!Array.isArray(definitions)) {
        throw new Error("The import must be a JSON array of variable definitions.");
      }

      await onSubmit(definitions);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "The import could not be read.",
      );
    }
  };

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    try {
      setJson(await file.text());
    } catch {
      setError("The selected file could not be read.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
        Import 1–100 new definitions. Existing names cancel the entire import,
        and variable values are never changed. Only <code>name</code> is
        required; other fields use the same defaults as the New Variable form.
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => loadFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <FileJson className="mr-2 h-4 w-4" />
          Choose JSON file
        </Button>
        <span className="text-xs text-muted-foreground">
          Or paste JSON below
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="variable-import-json">Variable definitions</Label>
        <Textarea
          id="variable-import-json"
          value={json}
          onChange={(event) => setJson(event.target.value)}
          className="min-h-[280px] font-mono text-sm"
          spellCheck={false}
          disabled={isLoading}
        />
      </div>

      {error && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="button"
        className="w-full"
        onClick={importDefinitions}
        disabled={isLoading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isLoading ? "Importing..." : "Import Definitions"}
      </Button>
    </div>
  );
}