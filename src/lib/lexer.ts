

import type { Token, TokenType } from '@/types/compiler';

// Basic keyword list (extend as needed for C, C++, Java)
const keywords = new Set([
    // JS base
    'let', 'const', 'var', 'if', 'else', 'for', 'while', 'function', 'return', 'class', 'new', 'import', 'export', 'from', 'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'public', 'private', 'protected', 'static', 'void', 'interface', 'implements', 'extends', 'super', 'this', 'true', 'false', 'null', 'undefined',
    // C/C++
    'int', 'float', 'double', 'char', 'long', 'short', 'unsigned', 'signed', 'struct', 'union', 'enum', 'typedef', 'sizeof', 'goto', 'volatile', 'extern', 'register', 'auto', '#include', '#define', '#ifdef', '#ifndef', '#endif', '#if', '#elif', '#else',
    // C++ specific
    'namespace', 'using', 'template', 'typename', 'virtual', 'override', 'final', 'delete', 'explicit', 'friend', 'inline', 'mutable', 'nullptr', 'operator', 'private', 'protected', 'public', 'reinterpret_cast', 'static_cast', 'dynamic_cast', 'const_cast', 'throw', 'noexcept',
    // Java specific
    'package', 'boolean', 'byte', 'final', 'finally', 'instanceof', 'native', 'strictfp', 'synchronized', 'throws', 'transient', 'abstract', 'assert', 'volatile'
]);

// Basic operator list (extend as needed)
const operators = new Set([
    '+', '-', '*', '/', '%', // Arithmetic
    '=', '+=', '-=', '*=', '/=', '%=', // Assignment
    '==', '===', '!=', '!==', '<', '>', '<=', '>=', // Comparison
    '&&', '||', '!', // Logical
    '++', '--', // Increment/Decrement
    '&', '|', '^', '~', '<<', '>>', // Bitwise
    '?', ':', // Ternary
    '.', // Member access
    '->', // Pointer member access (C/C++)
    '::', // Scope resolution (C++)
    '=>', // Arrow function (JS)
]);

// Basic punctuation list (extend as needed)
const punctuation = new Set(['{', '}', '(', ')', '[', ']', ';', ',', ':']); // Removed '.' as it's an operator now


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

    // 2. Handle Comments
    if (char === '/' && sourceCode[currentPosition + 1] === '/') { // Single-line comment
        while (currentPosition < sourceCode.length && sourceCode[currentPosition] !== '\n') {
            currentPosition++;
        }
        continue; // Skip the rest of the line
    }
     if (char === '/' && sourceCode[currentPosition + 1] === '*') { // Multi-line comment
        currentPosition += 2; // Skip /*
        while (currentPosition < sourceCode.length) {
            if (sourceCode[currentPosition] === '*' && sourceCode[currentPosition + 1] === '/') {
                currentPosition += 2; // Skip */
                break;
            }
             // Handle unterminated comment
             if (currentPosition === sourceCode.length - 1) {
                 throw new Error(`Lexer Error: Unterminated multi-line comment`);
             }
            currentPosition++;
        }
        continue;
     }


     // 3. Handle Preprocessor Directives (Basic #include, #define etc.)
     if (char === '#') {
         let directive = '#';
         currentPosition++;
          while (currentPosition < sourceCode.length && /[a-zA-Z_]/.test(sourceCode[currentPosition])) {
              directive += sourceCode[currentPosition];
              currentPosition++;
          }
          // Simple check if it looks like a known directive keyword
          if (keywords.has(directive)) {
              tokens.push({ type: 'PREPROCESSOR', value: directive });

              // Consume the rest of the line for the directive
              // This is very basic; proper handling needs more parsing for headers/macros
              while (currentPosition < sourceCode.length && sourceCode[currentPosition] !== '\n') {
                 // Let's add the rest as part of the value for simplicity, though it's not ideal lexing
                 // A better lexer would tokenize the header/macro definition separately
                 // We will just consume until newline for now.
                 // To handle <stdio.h> or "myheader.h", we need more logic.
                 // Example: Grab content within <> or ""
                 let directiveContent = '';
                 while (currentPosition < sourceCode.length && sourceCode[currentPosition] !== '\n') {
                    directiveContent += sourceCode[currentPosition];
                    currentPosition++;
                 }
                 // Optionally push the content as a separate token or part of the PREPROCESSOR token
                 // For now, just consume it. Add logic here if needed.
                 // Example: push { type: 'HEADER_NAME', value: content }
              }

          } else {
             // Treat as unknown or part of an identifier if '#' is allowed at the start
             // For now, let's treat unrecognized # directives as unknown or handle specific cases
             tokens.push({ type: 'UNKNOWN', value: directive }); // Or handle differently
          }

         continue;
     }


    // 4. Identify Operators (multi-character first)
     let potentialOperator = '';
     // Order by length, longest first
     if (operators.has(sourceCode.substring(currentPosition, currentPosition + 3))) { // ===, !==
        potentialOperator = sourceCode.substring(currentPosition, currentPosition + 3);
     } else if (operators.has(sourceCode.substring(currentPosition, currentPosition + 2))) { // ==, !=, <=, >=, &&, ||, ++, --, ->, ::, +=, -=, *=, /=, %=, <<, >>
        potentialOperator = sourceCode.substring(currentPosition, currentPosition + 2);
     } else if (operators.has(char)) { // +, -, *, /, =, <, >, !, &, |, ^, ~, ., %
        potentialOperator = char;
     }

     if (potentialOperator) {
        tokens.push({ type: 'OPERATOR', value: potentialOperator });
        currentPosition += potentialOperator.length;
        continue;
     }


    // 5. Identify Punctuation
    if (punctuation.has(char)) {
      tokens.push({ type: 'PUNCTUATION', value: char });
      currentPosition++;
      continue;
    }

    // 6. Identify Numbers (simple integers, decimals, potentially scientific notation)
    if (/\d/.test(char) || (char === '.' && /\d/.test(sourceCode[currentPosition + 1]))) { // Handle starting with '.' if followed by a digit
        let numStr = '';
        let hasDecimal = char === '.';
        if(char === '.') numStr += char; // Start with '.' if that's the case

        while (currentPosition < sourceCode.length) {
            const currentChar = sourceCode[currentPosition + (char === '.' ? 0 : numStr.length)]; // Adjust index based on start
            if (/\d/.test(currentChar)) {
                numStr += currentChar;
            } else if (currentChar === '.' && !hasDecimal) {
                numStr += currentChar;
                hasDecimal = true;
            } else {
                 // Add basic scientific notation (e.g., 1e-5, 2.5E+10) - simplified
                 if ((currentChar === 'e' || currentChar === 'E') && (sourceCode[currentPosition + numStr.length + 1] === '+' || sourceCode[currentPosition + numStr.length + 1] === '-' || /\d/.test(sourceCode[currentPosition + numStr.length + 1])) ) {
                     numStr += currentChar; // Add 'e' or 'E'
                     const sign = sourceCode[currentPosition + numStr.length];
                     if (sign === '+' || sign === '-') {
                         numStr += sign;
                     }
                     // Add exponent digits
                     while(currentPosition + numStr.length < sourceCode.length && /\d/.test(sourceCode[currentPosition + numStr.length])) {
                         numStr += sourceCode[currentPosition + numStr.length];
                     }
                      break; // Exit after parsing scientific part
                 } else {
                    break; // Not a digit, decimal, or start of scientific notation
                 }
            }
        }

         // Validate the number format
         // This regex is still basic, might need refinement for edge cases
        if (!/^((\d+(\.\d*)?)|(\.\d+))([eE][+-]?\d+)?$/.test(numStr)) {
             throw new Error(`Lexer Error: Invalid number format near '${numStr}'`);
        }

        tokens.push({ type: 'NUMBER', value: numStr });
        currentPosition += numStr.length - (char === '.' ? 1 : 0); // Adjust position based on starting char if it was '.'
        if(char === '.') currentPosition++; // Advance past the initial '.'
        continue;
    }


    // 7. Identify Identifiers and Keywords
    // Starts with a letter or underscore, followed by letters, numbers, or underscores
    // (Adjusted from JS: removed '$' as it's less common in C/C++/Java identifiers)
    if (/[a-zA-Z_]/.test(char)) {
      let identifier = '';
      while (currentPosition < sourceCode.length && /[a-zA-Z0-9_]/.test(sourceCode[currentPosition])) {
        identifier += sourceCode[currentPosition];
        currentPosition++;
      }

      if (keywords.has(identifier)) {
        // Check if it's a preprocessor keyword (already handled, but defensive check)
         if (identifier.startsWith('#')) {
             tokens.push({ type: 'PREPROCESSOR', value: identifier });
         } else {
            tokens.push({ type: 'KEYWORD', value: identifier });
         }
      } else {
        tokens.push({ type: 'IDENTIFIER', value: identifier });
      }
      continue; // Position already advanced
    }

    // 8. Identify Strings (double or single quotes) & Chars (single quotes in C/C++/Java)
     if (char === '"' || char === "'") {
        const quoteType = char;
        let strValue = '';
        let isChar = quoteType === "'"; // Potential character literal

        currentPosition++; // Move past the opening quote
        while (currentPosition < sourceCode.length && sourceCode[currentPosition] !== quoteType) {
             // Handle basic escape sequences
             if (sourceCode[currentPosition] === '\\' && currentPosition + 1 < sourceCode.length) {
                 // Add common escapes
                 const escapedChar = sourceCode[currentPosition + 1];
                 switch (escapedChar) {
                     case 'n': strValue += '\n'; break;
                     case 't': strValue += '\t'; break;
                     case 'r': strValue += '\r'; break;
                     case '\\': strValue += '\\'; break;
                     case "'": strValue += "'"; break;
                     case '"': strValue += '"'; break;
                     // Add more escapes (e.g., \0, \b, \f, \uXXXX) if needed
                     default: strValue += '\\' + escapedChar; // Keep unrecognized escapes as is
                 }
                 currentPosition += 2;
             } else {
                strValue += sourceCode[currentPosition];
                currentPosition++;
             }
        }
        if (currentPosition >= sourceCode.length || sourceCode[currentPosition] !== quoteType) {
             throw new Error(`Lexer Error: Unterminated string/char literal starting with ${quoteType}`);
        }
        currentPosition++; // Move past the closing quote

        // Distinguish between char and string for single quotes
        // A very basic check: length 1 is likely a char in C/++/Java
        // Note: Escape sequences like '\n' have length 1 in the resulting string value
        if (isChar && strValue.length === 1) {
             tokens.push({ type: 'CHARACTER', value: strValue }); // Assuming CHARACTER type exists
        } else {
             tokens.push({ type: 'STRING', value: strValue });
        }
        continue;
     }


    // 9. Unknown Character
    throw new Error(`Lexer Error: Unknown character '${char}' at position ${currentPosition}`);
  }

  tokens.push({ type: 'EOF', value: 'EOF' }); // End of File token
  return tokens;
}

// Add CHARACTER to TokenType if not already present
declare module '@/types/compiler' {
  export type TokenType =
    | 'KEYWORD'
    | 'IDENTIFIER'
    | 'OPERATOR'
    | 'PUNCTUATION'
    | 'NUMBER'
    | 'STRING'
    | 'CHARACTER' // Added character type
    | 'COMMENT'
    | 'WHITESPACE'
    | 'PREPROCESSOR'
    | 'EOF'
    | 'UNKNOWN';
}
