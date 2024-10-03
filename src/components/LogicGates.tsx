import React from "react";

const LogicGates: React.FC = () => {
  return (
    <div>
      <h2>Logic Gates in the Game of Life</h2>
      <p>
        This visualization demonstrates how basic logic gates (AND, OR, NOT,
        XOR) can be implemented using patterns in Conway's Game of Life.
      </p>
      <p>
        In the Game of Life, these gates can be constructed using specific
        arrangements of live cells:
      </p>
      <ul>
        <li>
          AND gate: Requires both inputs to be active to produce an output.
        </li>
        <li>OR gate: Produces an output if at least one input is active.</li>
        <li>
          NOT gate: Inverts the input, turning an active input into an inactive
          output and vice versa.
        </li>
        <li>XOR gate: Produces an output if exactly one input is active.</li>
      </ul>
      <p>
        These logic gates form the basis for more complex computations within
        the Game of Life, demonstrating its capability as a Turing complete
        system.
      </p>
      <p>
        Among the selectable patterns are patterns for AND, OR, XOR, and NOT
        Gates. Read more about how I did this on my blog!
      </p>
    </div>
  );
};

export default LogicGates;
