import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styles from "../styles/ConwayGame.module.css";
import ConwayAudio from "./ConwayAudio";

const CANVAS_SIZE = 600;
const grid_size = 150;

interface ConwayGameProps {
  initialGameState?: boolean[][];
  gridSize?: { width: number; height: number };
  cellSize?: number;
}

const ConwayGame: React.FC<ConwayGameProps> = ({
  initialGameState,
  gridSize = { width: grid_size, height: grid_size },
  cellSize = CANVAS_SIZE * (1 / grid_size),
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<boolean[][]>(
    () =>
      initialGameState ||
      Array(gridSize.height)
        .fill(null)
        .map(() => Array(gridSize.width).fill(false))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [tickRate, setTickRate] = useState(10);
  const [patterns, setPatterns] = useState<
    { name: string; grid: boolean[][] }[]
  >([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<{
    name: string;
    grid: boolean[][];
  } | null>(null);
  const [generation, setGeneration] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const { t } = useTranslation();

  const { initAudio, audioContext } = ConwayAudio({
    isRunning,
    isSoundOn,
    gameState,
    tickRate,
  });

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/patterns/index.json");
        const patternFiles = await response.json();
        const loadedPatterns = await Promise.all(
          patternFiles.map(async (file: string) => {
            const patternResponse = await fetch(`/patterns/${file}`);
            const rleContent = await patternResponse.text();
            const grid = parseRLE(rleContent);
            return { name: file.replace(".rle", ""), grid };
          })
        );
        setPatterns(loadedPatterns);
      } catch (error) {
        console.error("Error loading patterns:", error);
      }
    })();
  }, []);

  // Function to parse RLE format
  const parseRLE = (rleString: string): boolean[][] => {
    const lines = rleString.split("\n");
    let width = 0,
      height = 0;
    let grid: boolean[][] = [];
    let y = 0;

    for (let line of lines) {
      if (line.startsWith("#")) continue; // Skip comments
      if (line.startsWith("x")) {
        // Parse dimensions
        const match = line.match(/x\s*=\s*(\d+),\s*y\s*=\s*(\d+)/);
        if (match) {
          width = parseInt(match[1]);
          height = parseInt(match[2]);
          grid = Array(height)
            .fill(null)
            .map(() => Array(width).fill(false));
        }
        continue;
      }
      if (!width || !height) continue; // Skip if dimensions not set

      let x = 0;
      let count = "";
      for (let char of line) {
        if (char >= "0" && char <= "9") {
          count += char;
        } else if (char === "b" || char === "o" || char === "$") {
          const repeat = count ? parseInt(count) : 1;
          if (char === "b") {
            x += repeat;
          } else if (char === "o") {
            for (let i = 0; i < repeat; i++) {
              if (y < height && x < width) {
                grid[y][x] = true;
              }
              x++;
            }
          } else if (char === "$") {
            y += repeat;
            x = 0;
          }
          count = "";
        }
      }
      if (line.endsWith("!")) break;
    }

    return grid;
  };
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = CANVAS_SIZE;
    const height = CANVAS_SIZE;

    ctx.clearRect(0, 0, width, height);

    const computedStyle = getComputedStyle(document.documentElement);
    const liveCellColor =
      computedStyle.getPropertyValue("--live-cell-color") || "#000000";
    const deadCellColor =
      computedStyle.getPropertyValue("--dead-cell-color") || "#FFFFFF";

    gameState.forEach((row, y) => {
      row.forEach((cell, x) => {
        ctx.fillStyle = cell ? liveCellColor : deadCellColor;
        ctx.fillRect(
          x * cellSize,
          y * cellSize,
          cellSize - 0.5,
          cellSize - 0.5
        );
      });
    });
  }, [gameState, cellSize]);

  useEffect(() => {
    drawGame();
  }, [drawGame]);

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / cellSize);
      const y = Math.floor((event.clientY - rect.top) / cellSize);

      if (isEditMode && selectedPattern) {
        setGameState((prevState) => {
          const newState = prevState.map((row) => [...row]);
          selectedPattern.grid.forEach((row, dy) => {
            row.forEach((cell, dx) => {
              if (y + dy < gridSize.height && x + dx < gridSize.width) {
                newState[y + dy][x + dx] = cell;
              }
            });
          });
          return newState;
        });
      } else if (isDrawing) {
        setGameState((prevState) => {
          const newState = prevState.map((row) => [...row]);
          newState[y][x] = !newState[y][x];
          return newState;
        });
      }
    },
    [isEditMode, selectedPattern, isDrawing, cellSize, gridSize]
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      setIsDrawing(true);
      handleCanvasClick(event);
    },
    [handleCanvasClick]
  );

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / cellSize);
      const y = Math.floor((event.clientY - rect.top) / cellSize);
      if (isDrawing) {
        handleCanvasClick(event);
      }
      if (isEditMode && selectedPattern) {
        drawGame();

        // Draw pattern preview
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Semi-transparent red for preview
          selectedPattern.grid.forEach((row, i) => {
            row.forEach((cell, j) => {
              if (cell && y + i < gridSize.height && x + j < gridSize.width) {
                ctx.fillRect(
                  (x + j) * cellSize,
                  (y + i) * cellSize,
                  cellSize,
                  cellSize
                );
              }
            });
          });
        }
      }
    },
    [cellSize, isEditMode, selectedPattern, isDrawing, gridSize, drawGame]
  );

  const countNeighbors = useCallback(
    (board: boolean[][], x: number, y: number) => {
      let count = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const newX = (x + i + gridSize.width) % gridSize.width;
          const newY = (y + j + gridSize.height) % gridSize.height;
          if (board[newY][newX]) count++;
        }
      }
      return count;
    },
    [gridSize]
  );

  const updateGame = useCallback(() => {
    setGameState((prevState) => {
      return prevState.map((row, y) =>
        row.map((cell, x) => {
          const neighbors = countNeighbors(prevState, x, y);
          return (
            (cell && (neighbors === 2 || neighbors === 3)) ||
            (!cell && neighbors === 3)
          );
        })
      );
    });
    setGeneration((prev) => prev + 1);
  }, [countNeighbors]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRunning) {
      intervalId = setInterval(updateGame, 1000 / tickRate);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, updateGame, tickRate]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStartWithSound = () => {
    initAudio();
    setIsSoundOn(true);
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleToggleSound = () => {
    setIsSoundOn((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setGameState(
      Array(gridSize.height)
        .fill(null)
        .map(() => Array(gridSize.width).fill(false))
    );
    setGeneration(0);
  };

  const handleRandomize = () => {
    setIsRunning(false);
    setGameState(
      Array(gridSize.height)
        .fill(null)
        .map(() =>
          Array(gridSize.width)
            .fill(false)
            .map(() => Math.random() > 0.7)
        )
    );
    setGeneration(0);
  };

  const handlePatternSelect = (patternName: string) => {
    const pattern = patterns.find((p) => p.name === patternName);
    if (pattern) {
      setIsRunning(false);
      setIsEditMode(true);
      setSelectedPattern(pattern);
    }
  };

  const handleExitEditMode = () => {
    setIsEditMode(false);
    setSelectedPattern(null);
  };

  return (
    <div className={styles.gameContainer}>
      <canvas
        ref={canvasRef}
        width={gridSize.width * cellSize}
        height={gridSize.height * cellSize}
        className={styles.gameCanvas}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
      />
      <div className={styles.controls}>
        <button onClick={handleStart} disabled={isRunning}>
          {t("conwayGame.start")}
        </button>
        <button onClick={handleStartWithSound} disabled={isRunning}>
          {t("conwayGame.startWithSound")}
        </button>
        <button onClick={handleStop} disabled={!isRunning}>
          {t("conwayGame.stop")}
        </button>
        <button onClick={handleToggleSound} disabled={!isRunning}>
          {t(isSoundOn ? "conwayGame.turnSoundOff" : "conwayGame.turnSoundOn")}
        </button>
        <button onClick={handleReset}>{t("conwayGame.resetToZeros")}</button>
        <button onClick={handleRandomize}>{t("conwayGame.randomize")}</button>
        <div className={styles.patternList}>
          {patterns.map((pattern) => (
            <button
              key={pattern.name}
              onClick={() => handlePatternSelect(pattern.name)}
            >
              {t(`${pattern.name}`)}
            </button>
          ))}
        </div>
        {isEditMode && (
          <button onClick={handleExitEditMode}>
            {t("conwayGame.exitEditMode")}
          </button>
        )}
        <div>
          <label htmlFor="tickRate">
            {t("conwayGame.tickRate", { rate: tickRate })}
          </label>
          <input
            type="range"
            id="tickRate"
            min="1"
            max="60"
            value={tickRate}
            onChange={(e) => setTickRate(Number(e.target.value))}
          />
        </div>
        <div className={styles.generationCounter}>
          {t("conwayGame.generation")}: {generation}
        </div>
        <div>
          {t("conwayGame.audioContextState")}:{" "}
          {audioContext ? audioContext.state : t("conwayGame.notCreated")}
        </div>
        <div>
          {t("sound")}: {t(isSoundOn ? "conwayGame.on" : "conwayGame.off")}
        </div>
      </div>
    </div>
  );
};

export default ConwayGame;
