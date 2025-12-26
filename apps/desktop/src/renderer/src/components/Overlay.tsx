import React, { useEffect, useRef, useState } from "react";

export default function Overlay(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleStart = async () => {
      try {
        await window.api.ensureMicPermission();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const context = new AudioContext();
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;
        source.connect(analyser);

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mediaRecorder.start();
        setRecording(true);
        drawWaveform();
      } catch (e) {
        setError((e as Error).message);
      }
    };

    const handleStop = async () => {
      try {
        if (mediaRecorderRef.current && recording) {
          const recorder = mediaRecorderRef.current;
          await new Promise<void>((resolve) => {
            recorder.onstop = () => resolve();
            recorder.stop();
          });
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const arrayBuffer = await blob.arrayBuffer();
          await window.api.saveAudio(Buffer.from(arrayBuffer));
        }
      } finally {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        analyserRef.current = null;
        mediaRecorderRef.current = null;
        setRecording(false);
        // Don't call hideOverlay here - the main process handles hiding after receiving overlay:stop
      }
    };

    window.api.onOverlayStart(handleStart);
    window.api.onOverlayStop(handleStop);

    return () => {
      window.api.removeOverlayStart(handleStart);
      window.api.removeOverlayStop(handleStop);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [recording]);

  const drawWaveform = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      analyser.getByteTimeDomainData(dataArray);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#22c55e";
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i]! / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
  };

  return (
    <div className="border-border bg-background/90 pointer-events-auto rounded-md border p-3 shadow-xl">
      <div className="text-muted-foreground text-sm">
        {recording ? "Recording..." : error ? error : "Idle"}
      </div>
      <canvas ref={canvasRef} width={360} height={120} className="mt-2 block" />
      <div className="text-muted-foreground mt-2 text-xs">
        Press the global hotkey again to stop.
      </div>
    </div>
  );
}
