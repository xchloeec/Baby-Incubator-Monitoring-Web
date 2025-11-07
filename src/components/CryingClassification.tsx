import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

type ApiResponse = {
  label: "crying" | "normal";
  //confidence: number; // 0..1
  scores?: { crying: number; normal: number }; // optional breakdown
  message?: string; // optional backend message
};

export function CryingClassification({ socket }: { socket: any }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/\.wav$/i.test(f.name) && f.type !== "audio/wav") {
      setError("Please upload a .wav file.");
      setFile(null);
      return;
    }
    setFile(f);
  };

  const onDrop: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResult(null);
    setError("");
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!/\.wav$/i.test(f.name) && f.type !== "audio/wav") {
      setError("Please upload a .wav file.");
      setFile(null);
      return;
    }
    setFile(f);
  };

  const upload = async () => {
    if (!file) {
        setError("Select a .wav file first.");
        return;
    }

    setError("");
    setIsLoading(true);
    setResult(null);

    try {
        // Convert .wav file to base64 for Socket.IO transfer
        const arrayBuffer = await file.arrayBuffer();
        const base64data = btoa(
        new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
        )
        );

        // Send to Raspberry Pi 5 via socket
        socket.emit("cry_file", { base64: base64data });

        // Wait for classification result
        socket.once("cry_result", (data: any) => {
        if (data.error) {
            setError(data.error);
        } else {
            setResult(data);
        }
        setIsLoading(false);
        });
    } catch (err: any) {
        setError(err?.message || "Upload failed");
        setIsLoading(false);
    }
    };


  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const pct = (v: number | undefined) =>
    Math.max(0, Math.min(100, Math.round((v ?? 0) * 100)));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Crying Classification (Upload .wav)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="wav">Audio (.wav)</Label>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={onDrop}
              className="mt-2 flex h-32 w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-muted-foreground/40 px-4 text-center hover:bg-muted/40"
            >
              <div>
                <p className="text-sm">
                  Drag & drop your .wav here, or{" "}
                  <span className="underline">browse</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Max ~50 MB • WAV only
                </p>
              </div>
              <Input
                id="wav"
                ref={fileRef}
                type="file"
                accept=".wav,audio/wav"
                className="hidden"
                onChange={onPick}
              />
            </label>
            {file && (
              <p className="mt-2 text-sm">
                Selected: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
              </p>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          <div className="sm:col-span-1 flex flex-col gap-2">
            <Button onClick={upload} disabled={!file || isLoading}>
              {isLoading ? "Analyzing..." : "Analyze Audio"}
            </Button>
            <Button variant="secondary" onClick={reset} disabled={isLoading && !result}>
              Reset
            </Button>
          </div>
        </div>

        {/* Result Box */}
        <div className="rounded-2xl border p-4">
          <p className="mb-3 text-sm font-medium">Result</p>

          {!result && !isLoading && (
            <p className="text-sm text-muted-foreground">
              Upload a .wav file and click “Analyze Audio”. The prediction will appear here.
            </p>
          )}

          {isLoading && (
            <div className="space-y-2">
              <p className="text-sm">Running model…</p>
              <Progress value={45} />
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge                                                              
                  variant={result.label === "crying" ? "destructive" : "default"}
                  className="text-base"
                >
                  {result.label.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                 
                </span>
              </div>

              {result.scores && (
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Crying</span>
                      <span>{pct(result.scores.crying)}%</span>
                    </div>
                    <Progress value={pct(result.scores.crying)} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Normal</span>
                      <span>{pct(result.scores.normal)}%</span>
                    </div>
                    <Progress value={pct(result.scores.normal)} />
                  </div>
                </div>
              )}

              {result.message && (
                <p className="text-xs text-muted-foreground">{result.message}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CryingClassification;
