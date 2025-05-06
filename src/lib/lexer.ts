
import type { Token } from '@/types/compiler';

// Basic keyword list (extend as needed)
const keywords = new Set(['let', 'const', 'var', 'if', 'else', 'for', 'while', 'function', 'return', 'class', 'new', 'import', 'export', 'from']);
// Basic operator list (extend as needed)
const operators = new Set(['+', '-', '*', '/', '=', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '&&', '||', '!', '=>']);
// Basic punctuation list (extend as needed)
const punctuation = new Set(['{', '}', '(', ')', '[', ']', ';', ',', '.', ':']);

export function tokenize(sourceCode: string): Token[] {
  const tokens: Token[] = [];
  let currentPosition = 0;

  while (currentPosition < sourceCode.length) {
    let char = sourceCode[currentPosition];

    // 1. Skip Whitespace
    if (/\s/.test(char)) {
      currentPosition++;
      continue;
    }

    // 2. Handle Comments (simple single-line for now)
    if (char === '/' && sourceCode[currentPosition + 1] === '/') {
        while (currentPosition < sourceCode.length && sourceCode[currentPosition] !== '\n') {
            currentPosition++;
        }
        continue; // Skip the rest of the line
    }


    // 3. Identify Operators (multi-character first)
     let potentialOperator = '';
     if (operators.has(sourceCode.substring(currentPosition, currentPosition + 3))) { // Check for ===, !==
        potentialOperator = sourceCode.substring(currentPosition, currentPosition + 3);
     } else if (operators.has(sourceCode.substring(currentPosition, currentPosition + 2))) { // Check for ==, !=, <=, >=, &&, ||, =>
        potentialOperator = sourceCode.substring(currentPosition, currentPosition + 2);
     } else if (operators.has(char)) { // Check for single character operators +, -, *, /, =, <, >, !
        potentialOperator = char;
     }

     if (potentialOperator) {
        tokens.push({ type: 'OPERATOR', value: potentialOperator });
        currentPosition += potentialOperator.length;
        continue;
     }


    // 4. Identify Punctuation
    if (punctuation.has(char)) {
      tokens.push({ type: 'PUNCTUATION', value: char });
      currentPosition++;
      continue;
    }

    // 5. Identify Numbers (simple integers and decimals)
    if (/\d/.test(char)) {
      let numStr = '';
      while (currentPosition < sourceCode.length && (/\d/.test(sourceCode[currentPosition]) || (sourceCode[currentPosition] === '.' && !numStr.includes('.')))) {
         numStr += sourceCode[currentPosition];
         currentPosition++;
      }
       // Check if the number is valid (e.g., not just '.')
       if (numStr === '.' || !/^\d+(\.\d+)?$/.test(numStr)) {
           throw new Error(`Lexer Error: Invalid number format near '${numStr}'`);
       }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue; // Position already advanced in the loop
    }

    // 6. Identify Identifiers and Keywords
    // Starts with a letter, underscore, or dollar sign, followed by letters, numbers, underscores, or dollar signs
    if (/[a-zA-Z_$]/.test(char)) {
      let identifier = '';
      while (currentPosition < sourceCode.length && /[a-zA-Z0-9_$]/.test(sourceCode[currentPosition])) {
        identifier += sourceCode[currentPosition];
        currentPosition++;
      }

      if (keywords.has(identifier)) {
        tokens.push({ type: 'KEYWORD', value: identifier });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: identifier });
      }
      continue; // Position already advanced
    }

    // 7. Identify Strings (simple double or single quotes)
     if (char === '"' || char === "'") {
        const quoteType = char;
        let strValue = '';
        currentPosition++; // Move past the opening quote
        while (currentPosition < sourceCode.length && sourceCode[currentPosition] !== quoteType) {
             // Handle basic escape sequences if needed (e.g., \n, \t, \\, \')
             if (sourceCode[currentPosition] === '\\' && currentPosition + 1 < sourceCode.length) {
                // Add more escape sequence handling here if necessary
                strValue += sourceCode[currentPosition] + sourceCode[currentPosition + 1];
                currentPosition += 2;
             } else {
                strValue += sourceCode[currentPosition];
                currentPosition++;
             }
        }
        if (currentPosition >= sourceCode.length || sourceCode[currentPosition] !== quoteType) {
             throw new Error(`Lexer Error: Unterminated string literal starting with ${quoteType}`);
        }
        currentPosition++; // Move past the closing quote
        tokens.push({ type: 'STRING', value: strValue });
        continue;
     }


    // 8. Unknown Character
    throw new Error(`Lexer Error: Unknown character '${char}' at position ${currentPosition}`);
  }

  tokens.push({ type: 'EOF', value: 'EOF' }); // End of File token
  return tokens;
}
