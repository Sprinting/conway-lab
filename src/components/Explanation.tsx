import React from "react";

const Explanation: React.FC = () => {
  return (
    <div>
      <h2>Conway's Game of Life Explanation</h2>
      <p>
        Conway's Game of Life is a cellular automaton devised by mathematician
        John Conway in 1970. It's a zero-player game, meaning its evolution is
        determined by its initial state, with no further input from humans.
      </p>
      <h3>Rules:</h3>
      <ol>
        <li>
          Any live cell with fewer than two live neighbours dies
          (underpopulation).
        </li>
        <li>
          Any live cell with two or three live neighbours lives on to the next
          generation.
        </li>
        <li>
          Any live cell with more than three live neighbours dies
          (overpopulation).
        </li>
        <li>
          Any dead cell with exactly three live neighbours becomes a live cell
          (reproduction).
        </li>
      </ol>
      <p>
        These simple rules lead to complex and fascinating patterns, making the
        Game of Life a subject of great interest in computer science,
        mathematics, and theoretical biology.
      </p>
    </div>
  );
};

export default Explanation;
