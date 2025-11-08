"use client";

import { useUser } from "@clerk/nextjs";
import {
  CheckCircle2Icon,
  DownloadIcon,
  UploadIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSubscriptions } from "@/lib/use-subscriptions";

function downloadFile(
  content: string,
  filename: string,
  mimeType = "application/json"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        resolve(e.target.result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export function ExportImportSection() {
  const { user } = useUser();
  const { subscriptions, refreshSubscriptions } = useSubscriptions();
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = async () => {
    if (!user?.id) {
      alert("Please sign in to export subscriptions.");
      return;
    }
    try {
      const response = await fetch("/api/subscriptions");
      if (!response.ok) {
        throw new Error("Failed to fetch subscriptions");
      }
      const subscriptions = await response.json();
      const exportData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        subscriptions,
      };
      const jsonData = JSON.stringify(exportData, null, 2);
      const filename = `subscriptions-export-${new Date().toISOString().split("T")[0]}.json`;
      downloadFile(jsonData, filename);
    } catch (error) {
      console.error("Failed to export subscriptions:", error);
      alert("Failed to export subscriptions. Please try again.");
    }
  };

  const handleImport = async (file: File) => {
    if (!user?.id) {
      setImportError("Please sign in to import subscriptions.");
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const jsonData = await readFileAsText(file);
      const response = await fetch("/api/subscriptions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonData,
          options: {
            merge: mergeMode,
            overwrite: !mergeMode,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to import subscriptions" }));
        throw new Error(errorData.error || "Failed to import subscriptions");
      }

      const result = await response.json();

      if (result.errors.length > 0) {
        setImportError(
          `Imported ${result.imported} subscription(s). ${result.errors.length} error(s): ${result.errors.join("; ")}`
        );
      } else {
        setImportSuccess(
          `Successfully imported ${result.imported} subscription(s).`
        );
        await refreshSubscriptions();
        setTimeout(() => {
          resetDialog();
        }, 1500);
      }
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Failed to import subscriptions"
      );
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setImportError(null);
    setImportSuccess(null);
  };

  const handleImportClick = async () => {
    if (!selectedFile) {
      setImportError("Please select a file first.");
      return;
    }
    await handleImport(selectedFile);
  };

  const resetDialog = () => {
    setImportOpen(false);
    setImportError(null);
    setImportSuccess(null);
    setSelectedFile(null);
    setMergeMode(true);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        disabled={subscriptions.length === 0}
        onClick={handleExport}
        size="sm"
        variant="outline"
      >
        <DownloadIcon aria-hidden="true" className="size-4" />
        Export
      </Button>

      <Dialog
        onOpenChange={(open) => {
          if (open) {
            setImportOpen(true);
          } else {
            resetDialog();
          }
        }}
        open={importOpen}
      >
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <UploadIcon aria-hidden="true" className="size-4" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle>Import Subscriptions</DialogTitle>
            <DialogDescription>
              Upload a JSON file to import your subscriptions.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 py-4">
            <div className="flex flex-col gap-3">
              <Label className="font-medium text-sm">Import Mode</Label>
              <RadioGroup
                onValueChange={(value) => setMergeMode(value === "merge")}
                value={mergeMode ? "merge" : "replace"}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="merge" value="merge" />
                  <Label className="cursor-pointer font-normal" htmlFor="merge">
                    Merge with existing
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="replace" value="replace" />
                  <Label
                    className="cursor-pointer font-normal"
                    htmlFor="replace"
                  >
                    Replace all existing
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex flex-col gap-3">
              <Label className="font-medium text-sm" htmlFor="import-file">
                Select File
              </Label>
              <div className="flex flex-col gap-2">
                <input
                  accept=".json,application/json"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:font-medium file:text-primary-foreground file:text-sm file:hover:bg-primary/90"
                  disabled={importing}
                  id="import-file"
                  onChange={handleFileSelect}
                  type="file"
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <CheckCircle2Icon className="size-4 text-green-600" />
                    <span>{selectedFile.name}</span>
                  </div>
                )}
              </div>
            </div>

            {importError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive bg-destructive/10 p-3">
                <XCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p className="text-destructive text-sm">{importError}</p>
              </div>
            )}

            {importSuccess && (
              <div className="flex items-start gap-2 rounded-md border border-green-500 bg-green-500/10 p-3">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-green-600" />
                <p className="text-green-700 text-sm dark:text-green-400">
                  {importSuccess}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              disabled={importing}
              onClick={resetDialog}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={importing || !selectedFile}
              onClick={handleImportClick}
              type="button"
            >
              {importing ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
