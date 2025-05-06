
import type { Token, TokenType } from '@/types/compiler';

// Basic keyword list (extend as needed for C, C++, Java)
const keywords = new Set([
    // JS base (less relevant now, but keep for potential future use)
    'let', 'const', 'var', 'if', 'else', 'for', 'while', 'function', 'return', 'class', 'new', 'import', 'export', 'from', 'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'super', 'this', 'true', 'false', 'null', 'undefined',
    // C/C++
    'int', 'float', 'double', 'char', 'long', 'short', 'unsigned', 'signed', 'struct', 'union', 'enum', 'typedef', 'sizeof', 'goto', 'volatile', 'extern', 'register', 'auto', '#include', '#define', '#ifdef', '#ifndef', '#endif', '#if', '#elif', '#else', 'void',
    // C++ specific
    'namespace', 'using', 'template', 'typename', 'virtual', 'override', 'final', 'delete', 'explicit', 'friend', 'inline', 'mutable', 'nullptr', 'operator', 'private', 'protected', 'public', 'reinterpret_cast', 'static_cast', 'dynamic_cast', 'const_cast', 'noexcept', 'cout', 'cin', 'endl', 'std',
    // Java specific
    'package', 'boolean', 'byte', 'final', 'instanceof', 'native', 'strictfp', 'synchronized', 'throws', 'transient', 'abstract', 'assert', 'implements', 'interface', 'extends', 'static', 'System', 'out', 'println' // Added common Java elements
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
    '=>', // Arrow function (JS) - Less relevant for C/++/Java
]);

// Basic punctuation list (extend as needed)
const punctuation = new Set(['{', '}', '(', ')', '[', ']', ';', ',', ':']); // Removed '.' as it's an operator now


export function tokenize(sourceCode: string): Token[] {
  const tokens: Token[] = [];
  let currentPosition = 0;
  let line = 1;
  let column = 1;

   const getCurrentTokenInfo = (value: string, type: TokenType): Omit<Token, 'value' | 'type'> => ({
        line,
        column: column - value.length, // Start column of the token
   });

   const advancePosition = (length: number = 1) => {
       for (let i = 0; i < length; i++) {
            if (sourceCode[currentPosition + i] === '\n') {
                line++;
                column = 1;
            } else {
                column++;
            }
       }
       currentPosition += length;
   };


  while (currentPosition < sourceCode.length) {
    let char = sourceCode[currentPosition];
    const startColumn = column; // Store column at the start of potential token

    // 1. Skip Whitespace & Track Line/Column
    if (/\s/.test(char)) {
        advancePosition();
        continue;
    }

    // 2. Handle Comments
    if (char === '/' && sourceCode[currentPosition + 1] === '/') { // Single-line comment
        const commentStartColumn = column;
        let commentValue = '//';
        advancePosition(2); // Skip '//'
        while (currentPosition < sourceCode.length && sourceCode[currentPosition] !== '\n') {
            commentValue += sourceCode[currentPosition];
            advancePosition();
        }
        // Optionally add comment tokens:
        // tokens.push({ type: 'COMMENT', value: commentValue, line, column: commentStartColumn });
        continue; // Skip the rest of the line (advancePosition handles newline)
    }
     if (char === '/' && sourceCode[currentPosition + 1] === '*') { // Multi-line comment
        const commentStartLine = line;
        const commentStartColumn = column;
        let commentValue = '/*';
        advancePosition(2); // Skip /*
        while (currentPosition < sourceCode.length) {
             const current = sourceCode[currentPosition];
             const next = sourceCode[currentPosition + 1];
            if (current === '*' && next === '/') {
                commentValue += '*/';
                advancePosition(2); // Skip */
                break;
            }
            commentValue += current;
            advancePosition();
             // Handle unterminated comment
             if (currentPosition >= sourceCode.length) {
                 // Use starting position for error reporting
                  throw new Error(`Lexer Error (Line ${commentStartLine}, Col ${commentStartColumn}): Unterminated multi-line comment`);
             }
        }
         // Optionally add comment tokens:
         // tokens.push({ type: 'COMMENT', value: commentValue, line: commentStartLine, column: commentStartColumn });
        continue;
     }


     // 3. Handle Preprocessor Directives (Basic #include, #define etc.)
     if (char === '#') {
         const directiveStartColumn = column;
         let directive = '#';
         advancePosition(); // Move past '#'
          while (currentPosition < sourceCode.length && /[a-zA-Z_]/.test(sourceCode[currentPosition])) {
              directive += sourceCode[currentPosition];
              advancePosition();
          }
          // Simple check if it looks like a known directive keyword
          // Note: #define needs more complex parsing for macro name and body
          if (keywords.has(directive)) {
               tokens.push({ type: 'PREPROCESSOR', value: directive, line, column: directiveStartColumn });
              // Consume the rest of the line for the directive content (basic)
               let directiveContent = '';
               while (currentPosition < sourceCode.length && sourceCode[currentPosition] !== '\n') {
                  directiveContent += sourceCode[currentPosition];
                  advancePosition();
               }
              // Optionally add the content as a separate token (e.g., HEADER_NAME, MACRO_BODY)
               if (directiveContent.trim()) {
                    // Very basic push of the rest of the line
                   // tokens.push({ type: 'DIRECTIVE_CONTENT', value: directiveContent.trim(), line, column: directiveStartColumn + directive.length });
               }

          } else {
             tokens.push({ type: 'UNKNOWN', value: directive, line, column: directiveStartColumn }); // Or handle specific cases like #pragma
          }
         continue;
     }


    // 4. Identify Operators (multi-character first)
     let potentialOperator = '';
     // Order by length, longest first for greedy matching
     const threeCharOp = sourceCode.substring(currentPosition, currentPosition + 3);
     const twoCharOp = sourceCode.substring(currentPosition, currentPosition + 2);

     if (operators.has(threeCharOp)) { // ===, !==
        potentialOperator = threeCharOp;
     } else if (operators.has(twoCharOp)) { // ==, !=, <=, >=, &&, ||, ++, --, ->, ::, +=, -=, *=, /=, %=, <<, >>
        potentialOperator = twoCharOp;
     } else if (operators.has(char)) { // +, -, *, /, =, <, >, !, &, |, ^, ~, ., %
        potentialOperator = char;
     }

     if (potentialOperator) {
        tokens.push({ type: 'OPERATOR', value: potentialOperator, line, column: startColumn });
        advancePosition(potentialOperator.length);
        continue;
     }


    // 5. Identify Punctuation
    if (punctuation.has(char)) {
      tokens.push({ type: 'PUNCTUATION', value: char, line, column: startColumn });
      advancePosition();
      continue;
    }

    // 6. Identify Numbers (integers, decimals, basic scientific notation)
    if (/\d/.test(char) || (char === '.' && /\d/.test(sourceCode[currentPosition + 1]))) {
        const numStartColumn = column;
        let numStr = '';
        let hasDecimal = false;
        let hasExponent = false;

         // Allow starting with '.' if followed by digit
         if (char === '.') {
             numStr += char;
             hasDecimal = true;
             advancePosition();
         }

        while (currentPosition < sourceCode.length) {
            const currentChar = sourceCode[currentPosition];

            if (/\d/.test(currentChar)) {
                numStr += currentChar;
                advancePosition();
            } else if (currentChar === '.' && !hasDecimal && !hasExponent) { // Only one decimal point allowed, before exponent
                numStr += currentChar;
                hasDecimal = true;
                advancePosition();
            } else if ((currentChar === 'e' || currentChar === 'E') && !hasExponent) { // Scientific notation
                numStr += currentChar;
                hasExponent = true;
                advancePosition();
                 // Check for optional sign (+ or -)
                 const sign = sourceCode[currentPosition];
                 if (sign === '+' || sign === '-') {
                     numStr += sign;
                     advancePosition();
                 }
                  // Expect at least one digit after 'e/E' (or sign)
                  if (!/\d/.test(sourceCode[currentPosition])) {
                      throw new Error(`Lexer Error (Line ${line}, Col ${column}): Invalid scientific notation - exponent missing digits near '${numStr}'`);
                  }
            } else {
                break; // End of number
            }
        }

        // Simple validation (can be improved with more robust regex)
        if (!/^((\d+(\.\d*)?)|(\.\d+))([eE][+-]?\d+)?$/.test(numStr) || numStr === '.') {
            throw new Error(`Lexer Error (Line ${line}, Col ${numStartColumn}): Invalid number format near '${numStr}'`);
        }

        tokens.push({ type: 'NUMBER', value: numStr, line, column: numStartColumn });
        continue; // Position already advanced by the loop
    }


    // 7. Identify Identifiers and Keywords
    // Starts with a letter or underscore, followed by letters, numbers, or underscores
    if (/[a-zA-Z_]/.test(char)) {
        const identStartColumn = column;
        let identifier = '';
        while (currentPosition < sourceCode.length && /[a-zA-Z0-9_]/.test(sourceCode[currentPosition])) {
            identifier += sourceCode[currentPosition];
            advancePosition();
        }

        const type = keywords.has(identifier) ? 'KEYWORD' : 'IDENTIFIER';
         // Check for C++ scope resolution operator (::) within identifier-like sequences
         // This is tricky and might require more context or a parser stage
         // Example: std::cout - lexer might see 'std', '::', 'cout'
         // Our current greedy operator matching handles '::' already.

        tokens.push({ type, value: identifier, line, column: identStartColumn });
        continue; // Position already advanced
    }

    // 8. Identify Strings (double or single quotes) & Chars (single quotes in C/C++/Java)
     if (char === '"' || char === "'") {
        const quoteType = char;
        const literalStartLine = line;
        const literalStartColumn = column;
        let strValue = '';
        let isChar = quoteType === "'";

        advancePosition(); // Move past the opening quote
        while (currentPosition < sourceCode.length && sourceCode[currentPosition] !== quoteType) {
             // Handle basic escape sequences
             if (sourceCode[currentPosition] === '\\' && currentPosition + 1 < sourceCode.length) {
                 const escapedChar = sourceCode[currentPosition + 1];
                 switch (escapedChar) {
                     case 'n': strValue += '\n'; break;
                     case 't': strValue += '\t'; break;
                     case 'r': strValue += '\r'; break;
                     case '\\': strValue += '\\'; break;
                     case "'": strValue += "'"; break;
                     case '"': strValue += '"'; break;
                     // Add more escapes as needed (e.g., \0, \b, \f, \uXXXX)
                     default: strValue += '\\' + escapedChar; // Keep unrecognized escapes
                 }
                 advancePosition(2);
             } else if (sourceCode[currentPosition] === '\n') {
                 // Handle newline within literal - depends on language rules (often error for char/string)
                  throw new Error(`Lexer Error (Line ${line}, Col ${column}): Newline in string/char literal is often invalid.`);
                 // If allowed: strValue += '\n'; advancePosition();
             } else {
                strValue += sourceCode[currentPosition];
                advancePosition();
             }
        }
        if (currentPosition >= sourceCode.length || sourceCode[currentPosition] !== quoteType) {
             throw new Error(`Lexer Error (Line ${literalStartLine}, Col ${literalStartColumn}): Unterminated string/char literal starting with ${quoteType}`);
        }
        advancePosition(); // Move past the closing quote

        // Distinguish char and string for single quotes
        if (isChar && strValue.length === 1) {
             tokens.push({ type: 'CHARACTER', value: strValue, line: literalStartLine, column: literalStartColumn });
        } else if (isChar && strValue.length !== 1) {
             // Multi-character literal in single quotes (often an error or specific C/C++ feature)
             // Handle as error or specific type if needed
              throw new Error(`Lexer Error (Line ${literalStartLine}, Col ${literalStartColumn}): Multi-character char literal '${strValue}' (use double quotes for strings).`);
             // Or: tokens.push({ type: 'MULTI_CHAR_LITERAL', value: strValue, line: literalStartLine, column: literalStartColumn });
        } else {
             tokens.push({ type: 'STRING', value: strValue, line: literalStartLine, column: literalStartColumn });
        }
        continue;
     }


    // 9. Unknown Character
     const unknownChar = char;
     advancePosition(); // Move past the unknown character to avoid infinite loop
    throw new Error(`Lexer Error (Line ${line}, Col ${startColumn}): Unknown character '${unknownChar}'`);
  }

  tokens.push({ type: 'EOF', value: 'EOF', line, column }); // Add EOF token with final position
  return tokens;
}
