import { useCallback, useEffect, useRef, useState } from "react";

interface ConwayAudioProps {
  isRunning: boolean;
  isSoundOn: boolean;
  gameState: boolean[][];
  tickRate: number;
}

const ConwayAudio = ({
  isRunning,
  isSoundOn,
  gameState,
  tickRate,
}: ConwayAudioProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  const initAudio = useCallback(() => {
    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed"
    ) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      setIsAudioInitialized(true);
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  }, []);

  const stopAllOscillators = useCallback(() => {
    oscillatorsRef.current.forEach((osc) => {
      osc.stop();
      osc.disconnect();
    });
    oscillatorsRef.current = [];
  }, []);

  const countNeighbors = (x: number, y: number) => {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const newX = (x + i + gameState.length) % gameState.length;
        const newY = (y + j + gameState[0].length) % gameState[0].length;
        if (gameState[newX][newY]) count++;
      }
    }
    return count;
  };

  const playSound = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state !== "running")
      return;

    stopAllOscillators();

    if (!isRunning || !isSoundOn) return;

    const height = gameState.length;
    const width = gameState[0].length;
    let soundCount = 0;

    const frequencies = [523.25, 587.33, 659.25, 698.46, 783.99, 880];

    for (let x = 0; x < height && soundCount < 16; x++) {
      for (let y = 0; y < width && soundCount < 16; y++) {
        if (gameState[x][y]) {
          const neighbors = countNeighbors(x, y);
          const frequency = frequencies[neighbors % frequencies.length];
          const detune = 25 * (x / height - 0.5) + 25 * (y / width - 0.5);

          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          const pannerNode = audioContextRef.current.createStereoPanner();

          oscillator.type = ["sine", "triangle"][
            Math.floor((2 * x) / height)
          ] as OscillatorType;
          oscillator.frequency.setValueAtTime(
            frequency,
            audioContextRef.current.currentTime
          );
          oscillator.detune.setValueAtTime(
            detune,
            audioContextRef.current.currentTime
          );

          const volume = (0.05 * (neighbors + 1)) / 9;
          gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
          gainNode.gain.linearRampToValueAtTime(
            volume,
            audioContextRef.current.currentTime + 0.01
          );

          const pan = (y / width) * 2 - 1;
          pannerNode.pan.setValueAtTime(
            pan,
            audioContextRef.current.currentTime
          );

          oscillator.connect(gainNode);
          gainNode.connect(pannerNode);
          pannerNode.connect(audioContextRef.current.destination);

          oscillator.start();
          oscillatorsRef.current.push(oscillator);

          soundCount++;
        }
      }
    }
  }, [isRunning, isSoundOn, gameState, stopAllOscillators]);

  useEffect(() => {
    if (isSoundOn) {
      initAudio();
    } else {
      stopAllOscillators();
    }
  }, [isSoundOn, initAudio, stopAllOscillators]);

  useEffect(() => {
    if (isAudioInitialized && isSoundOn) {
      const intervalId = setInterval(playSound, 1000 / tickRate);
      return () => clearInterval(intervalId);
    }
  }, [isAudioInitialized, isSoundOn, playSound, tickRate]);

  return {
    initAudio,
    audioContext: audioContextRef.current,
  };
};

export default ConwayAudio;
