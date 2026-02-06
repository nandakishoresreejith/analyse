import { VisualizationStep, ExecutionResult } from '../types';

export const executeUserCode = (code: string, initialData: number[]): ExecutionResult => {
  const steps: VisualizationStep[] = [];
  const logs: string[] = [];
  
  // Clone data to avoid mutating the prop reference directly in the first step
  const workingData = [...initialData];

  // Helper to capture steps
  const snapshot = (arr: number[], highlights: number[] = [], description: string = '') => {
    // Limit steps to prevent browser crash on infinite loops
    if (steps.length > 1000) throw new Error("Step limit exceeded (infinite loop protection)");
    steps.push({
      array: [...arr],
      highlights: [...highlights],
      description
    });
  };

  // Helper to capture console logs
  const mockConsole = {
    log: (...args: any[]) => logs.push(args.map(a => String(a)).join(' ')),
    warn: (...args: any[]) => logs.push(`WARN: ${args.map(a => String(a)).join(' ')}`),
    error: (...args: any[]) => logs.push(`ERROR: ${args.map(a => String(a)).join(' ')}`),
  };

  try {
    // We wrap the user's code in a function context.
    // The user code is expected to be a function body or a direct script that uses 'data' and 'snapshot'.
    // To make it easier, we will assume the user defines a function named 'sort(data, snapshot)'.
    // OR we can wrap their code. Let's try to detect if they defined a function or just wrote statements.

    let executableCode = code;
    
    // If code doesn't explicitly call sort, we append a call to it if detected, or wrap it.
    // For this simple viz, we enforce a contract: Code must define 'function sort(data, snapshot) { ... }'
    // We will append 'sort(workingData, snapshot);' to run it.
    
    const runCode = new Function('data', 'snapshot', 'console', `
      "use strict";
      try {
        ${executableCode}
        
        if (typeof sort === 'function') {
          sort(data, snapshot);
        } else {
           // Fallback if they just wrote procedural code using 'data' global in this scope
        }
      } catch (err) {
        throw err;
      }
    `);

    runCode(workingData, snapshot, mockConsole);

    return { steps, logs };

  } catch (err: any) {
    return {
      steps: [],
      error: err.message || "Unknown execution error",
      logs
    };
  }
};

export const DEFAULT_INSERTION_SORT = `// 1. Define your sort function
// 2. Use 'snapshot(array, [indices])' to visualize steps

function sort(data, snapshot) {
  const n = data.length;
  
  for (let i = 1; i < n; i++) {
    let key = data[i];
    let j = i - 1;
    
    // Highlight the key we are trying to insert
    snapshot([...data], [i], \`Selected key \${key} at index \${i}\`);

    // Move elements of data[0..i-1] that are greater than key
    // to one position ahead of their current position
    while (j >= 0 && data[j] > key) {
      snapshot([...data], [j, j + 1], \`Comparing \${data[j]} > \${key}\`);
      
      data[j + 1] = data[j];
      
      snapshot([...data], [j, j + 1], \`Moved \${data[j]} forward\`);
      j = j - 1;
    }
    
    data[j + 1] = key;
    snapshot([...data], [j + 1], \`Inserted \${key} at position \${j + 1}\`);
  }
  
  snapshot([...data], [], "Sorting Complete!");
}`;