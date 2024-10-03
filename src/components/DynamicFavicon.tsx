import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";

const DynamicFavicon: React.FC = () => {
  const [grid, setGrid] = useState<number[][]>([]);
  const size = 16; // 16x16 grid for the favicon
  const cellSize = 1; // Size of each cell in SVG units

  const computedStyle = getComputedStyle(document.documentElement);
  const cellColor =
    computedStyle.getPropertyValue("--dead-cell-color") || "#000000";
  const backgroundColor =
    computedStyle.getPropertyValue("--live-cell-color") || "#FFFFFF";

  useEffect(() => {
    // Initialize grid
    const initialGrid = Array(size)
      .fill(null)
      .map(() =>
        Array(size)
          .fill(0)
          .map(() => (Math.random() > 0.5 ? 1 : 0))
      );
    setGrid(initialGrid);

    // Set up interval for updates
    const interval = setInterval(() => {
      setGrid((prevGrid) => updateGrid(prevGrid));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const updateGrid = (prevGrid: number[][]) => {
    return prevGrid.map((row, i) =>
      row.map((cell, j) => {
        const neighbors = countNeighbors(prevGrid, i, j);
        if (cell === 1 && (neighbors < 2 || neighbors > 3)) return 0;
        if (cell === 0 && neighbors === 3) return 1;
        return cell;
      })
    );
  };

  const countNeighbors = (grid: number[][], x: number, y: number) => {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const newX = (x + i + size) % size;
        const newY = (y + j + size) % size;
        count += grid[newX][newY];
      }
    }
    return count;
  };

  const svgFavicon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${backgroundColor}" />
      ${grid
        .map((row, i) =>
          row
            .map((cell, j) =>
              cell
                ? `<rect x="${j * cellSize}" y="${
                    i * cellSize
                  }" width="${cellSize}" height="${cellSize}" fill="${cellColor}" />`
                : ""
            )
            .join("")
        )
        .join("")}
    </svg>
  `;

  const faviconUrl = `data:image/svg+xml;base64,${btoa(svgFavicon)}`;

  return (
    <Helmet>
      <link rel="icon" type="image/svg+xml" href={faviconUrl} />
    </Helmet>
  );
};

export default DynamicFavicon;
