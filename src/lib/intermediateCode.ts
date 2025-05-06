
import type { Token, ThreeAddressCode, Quadruple } from '@/types/compiler';

/**
 * Generates simplified Three-Address Code (TAC) from tokens.
 * This is a significantly enhanced placeholder but still requires more robust parsing
 * for real-world scenarios (like proper expression parsing, control flow nesting, function calls).
 * It handles simple assignments, binary operations, and basic 'if' and 'while' statements.
 */
export function generateTAC(tokens: Token[]): ThreeAddressCode[] {
  const tac: ThreeAddressCode[] = [];
  let tempVarCount = 0;
  let labelCount = 0;

  const getTempVar = () => `t${tempVarCount++}`;
  const getLabel = () => `L${labelCount++}`;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];
    const thirdToken = tokens[i + 2];
    const fourthToken = tokens[i + 3];

    // 1. Simple Assignment: identifier = expression;
    //    Handles: x = y; x = 5; x = y + z; x = y * 5;
    if (token.type === 'IDENTIFIER' && nextToken?.value === '=') {
      const assignedVar = token.value;
      const exprStartTokenIndex = i + 2; // Index of the token after '='

      // Find the end of the expression (usually ';')
      let exprEndTokenIndex = exprStartTokenIndex;
      while (exprEndTokenIndex < tokens.length && tokens[exprEndTokenIndex].value !== ';') {
        exprEndTokenIndex++;
      }

      // Basic expression handling (single value or simple binary op)
      const firstExprToken = tokens[exprStartTokenIndex];
      const secondExprToken = tokens[exprStartTokenIndex + 1];
      const thirdExprToken = tokens[exprStartTokenIndex + 2];

      // Case: x = value; (value is identifier or number)
      if (exprEndTokenIndex === exprStartTokenIndex + 1 && (firstExprToken?.type === 'IDENTIFIER' || firstExprToken?.type === 'NUMBER' || firstExprToken?.type === 'STRING' || firstExprToken?.type === 'CHARACTER')) {
        tac.push({ op: '=', arg1: firstExprToken.value, arg2: null, result: assignedVar });
        i = exprEndTokenIndex; // Move index past ';'
      }
      // Case: x = arg1 op arg2;
      else if (
          (firstExprToken?.type === 'IDENTIFIER' || firstExprToken?.type === 'NUMBER') &&
          secondExprToken?.type === 'OPERATOR' &&
          (thirdExprToken?.type === 'IDENTIFIER' || thirdExprToken?.type === 'NUMBER') &&
           exprEndTokenIndex === exprStartTokenIndex + 3 // Ensure it's exactly arg1 op arg2 ;
         )
      {
        const tempVar = getTempVar();
        tac.push({ op: secondExprToken.value, arg1: firstExprToken.value, arg2: thirdExprToken.value, result: tempVar });
        tac.push({ op: '=', arg1: tempVar, arg2: null, result: assignedVar });
        i = exprEndTokenIndex; // Move index past ';'
      }
      // TODO: Add more complex expression handling (parentheses, function calls, multiple ops)
      else {
           // Placeholder for more complex expressions - could generate a call or simplify
           // For now, just assign the first token if simple, or mark as complex
            if (firstExprToken) {
                tac.push({ op: '=', arg1: `expr(...)`, arg2: null, result: assignedVar }); // Indicate complex expr
            }
           i = exprEndTokenIndex;
      }
      continue;
    }

     // 2. Declaration with Initialization: let x = expression; / int x = expression;
     //    (Similar to assignment, but might involve type keywords)
     if (token.type === 'KEYWORD' && ['let', 'const', 'var', 'int', 'float', 'double', 'char', 'auto'].includes(token.value) &&
         nextToken?.type === 'IDENTIFIER' &&
         thirdToken?.value === '=')
    {
        const assignedVar = nextToken.value;
        const exprStartTokenIndex = i + 3; // After 'type identifier ='

        let exprEndTokenIndex = exprStartTokenIndex;
        while (exprEndTokenIndex < tokens.length && tokens[exprEndTokenIndex].value !== ';') {
            exprEndTokenIndex++;
        }

        // Basic expression handling (copy from assignment logic above)
        const firstExprToken = tokens[exprStartTokenIndex];
        const secondExprToken = tokens[exprStartTokenIndex + 1];
        const thirdExprToken = tokens[exprStartTokenIndex + 2];

        if (exprEndTokenIndex === exprStartTokenIndex + 1 && (firstExprToken?.type === 'IDENTIFIER' || firstExprToken?.type === 'NUMBER' || firstExprToken?.type === 'STRING' || firstExprToken?.type === 'CHARACTER')) {
            tac.push({ op: '=', arg1: firstExprToken.value, arg2: null, result: assignedVar });
            i = exprEndTokenIndex;
        } else if (
            (firstExprToken?.type === 'IDENTIFIER' || firstExprToken?.type === 'NUMBER') &&
            secondExprToken?.type === 'OPERATOR' &&
            (thirdExprToken?.type === 'IDENTIFIER' || thirdExprToken?.type === 'NUMBER') &&
            exprEndTokenIndex === exprStartTokenIndex + 3
           ) {
            const tempVar = getTempVar();
            tac.push({ op: secondExprToken.value, arg1: firstExprToken.value, arg2: thirdExprToken.value, result: tempVar });
            tac.push({ op: '=', arg1: tempVar, arg2: null, result: assignedVar });
            i = exprEndTokenIndex;
        } else {
             if (firstExprToken) {
                  tac.push({ op: '=', arg1: `expr(...)`, arg2: null, result: assignedVar });
             }
            i = exprEndTokenIndex;
        }
        continue;
    }


    // 3. Basic 'if' statement: if (condition) ...
    //    Generates: if_false condition goto L_else; ... L_else: ...
    //    Limitation: Handles only simple conditions like (a > b), (x == 5). Doesn't handle complex logic or nested 'if's well.
    if (token.type === 'KEYWORD' && token.value === 'if' && nextToken?.value === '(') {
        let conditionStartIndex = i + 2;
        let conditionEndIndex = conditionStartIndex;
        let parenDepth = 1;

        // Find the closing parenthesis of the condition
        while (conditionEndIndex < tokens.length) {
             if(tokens[conditionEndIndex].value === '(') parenDepth++;
             if(tokens[conditionEndIndex].value === ')') parenDepth--;
             if(parenDepth === 0) break;
             conditionEndIndex++;
        }

        if (parenDepth !== 0) { /* Handle syntax error: unmatched parenthesis */ i++; continue; }

         // Extract condition tokens (basic: arg1 op arg2)
         const condArg1 = tokens[conditionStartIndex];
         const condOp = tokens[conditionStartIndex + 1];
         const condArg2 = tokens[conditionStartIndex + 2];

         if (conditionEndIndex === conditionStartIndex + 3 && // Ensure simple condition a op b
             (condArg1?.type === 'IDENTIFIER' || condArg1?.type === 'NUMBER') &&
             condOp?.type === 'OPERATOR' && // Assume comparison/logical operator
             (condArg2?.type === 'IDENTIFIER' || condArg2?.type === 'NUMBER'))
         {
              const tempCond = getTempVar();
              const elseLabel = getLabel(); // Label to jump to if condition is false

              // Generate TAC for the condition check
              tac.push({ op: condOp.value, arg1: condArg1.value, arg2: condArg2.value, result: tempCond });
              // Generate the conditional jump
              tac.push({ op: 'if_false', arg1: tempCond, arg2: null, result: `goto ${elseLabel}` });

              // Placeholder: Process the 'if' block here...
              // A real parser would recursively call itself or manage block scope

              // Add the else label marker to the TAC stream
              // The actual code for the 'else' block (or code after 'if') would follow this label.
              // This simplified generator doesn't parse the block content, so we just add the label marker.
              // Later, a jump to an 'end_if' label might be needed.
              tac.push({ op: 'label', arg1: elseLabel, arg2: null, result: ':' });


              i = conditionEndIndex; // Move index past the ')'
              // Need to skip the body of the if block - requires finding matching braces {}
              // Simple skip for now:
              let braceDepth = 0;
               let blockEndIndex = conditionEndIndex + 1;
               if(tokens[blockEndIndex]?.value === '{') {
                   braceDepth = 1;
                   blockEndIndex++;
                   while(blockEndIndex < tokens.length && braceDepth > 0) {
                       if(tokens[blockEndIndex].value === '{') braceDepth++;
                       if(tokens[blockEndIndex].value === '}') braceDepth--;
                       blockEndIndex++;
                   }
                   i = blockEndIndex -1; // Position after closing brace
               } else {
                  // Handle single statement if block without braces (more complex)
                  while(blockEndIndex < tokens.length && tokens[blockEndIndex].value !== ';') {
                      blockEndIndex++;
                  }
                  i = blockEndIndex; // Position after semicolon
               }


         } else {
             // Handle complex condition or error
              tac.push({ op: 'if_false', arg1: `complex_cond`, arg2: null, result: `goto L_complex_else` });
              i = conditionEndIndex; // Skip condition part
               // TODO: Skip body
         }
        continue;
    }

     // 4. Basic 'while' loop: while (condition) { ... }
     //    Generates: L_start: if_false condition goto L_end; ... goto L_start; L_end: ...
     //    Limitations: Similar to 'if', handles simple conditions. Doesn't handle break/continue well.
     if (token.type === 'KEYWORD' && token.value === 'while' && nextToken?.value === '(') {
         const startLabel = getLabel();
         const endLabel = getLabel();

         let conditionStartIndex = i + 2;
         let conditionEndIndex = conditionStartIndex;
         let parenDepth = 1;

         // Find the closing parenthesis of the condition
         while (conditionEndIndex < tokens.length) {
              if(tokens[conditionEndIndex].value === '(') parenDepth++;
              if(tokens[conditionEndIndex].value === ')') parenDepth--;
              if(parenDepth === 0) break;
              conditionEndIndex++;
         }

         if (parenDepth !== 0) { /* Handle error */ i++; continue; }

         const condArg1 = tokens[conditionStartIndex];
         const condOp = tokens[conditionStartIndex + 1];
         const condArg2 = tokens[conditionStartIndex + 2];

         // Add the start label for the loop
         tac.push({ op: 'label', arg1: startLabel, arg2: null, result: ':' });

         if (conditionEndIndex === conditionStartIndex + 3 &&
             (condArg1?.type === 'IDENTIFIER' || condArg1?.type === 'NUMBER') &&
             condOp?.type === 'OPERATOR' &&
             (condArg2?.type === 'IDENTIFIER' || condArg2?.type === 'NUMBER'))
        {
             const tempCond = getTempVar();
             // Generate TAC for the condition check
             tac.push({ op: condOp.value, arg1: condArg1.value, arg2: condArg2.value, result: tempCond });
             // Generate the conditional jump to exit the loop
             tac.push({ op: 'if_false', arg1: tempCond, arg2: null, result: `goto ${endLabel}` });

             // Placeholder: Process the loop body here...

             // Add the unconditional jump back to the start of the loop
             tac.push({ op: 'goto', arg1: startLabel, arg2: null, result: '' });
             // Add the end label marker
             tac.push({ op: 'label', arg1: endLabel, arg2: null, result: ':' });

              i = conditionEndIndex; // Move index past ')'
               // Skip body (simple brace matching)
               let braceDepth = 0;
               let blockEndIndex = conditionEndIndex + 1;
               if(tokens[blockEndIndex]?.value === '{') {
                   braceDepth = 1;
                   blockEndIndex++;
                   while(blockEndIndex < tokens.length && braceDepth > 0) {
                       if(tokens[blockEndIndex].value === '{') braceDepth++;
                       if(tokens[blockEndIndex].value === '}') braceDepth--;
                       blockEndIndex++;
                   }
                   i = blockEndIndex -1; // Position after closing brace
               } else {
                   // Handle single statement while loop
                    while(blockEndIndex < tokens.length && tokens[blockEndIndex].value !== ';') {
                       blockEndIndex++;
                   }
                   i = blockEndIndex;
               }

        } else {
             // Handle complex condition or error
              tac.push({ op: 'if_false', arg1: `complex_cond`, arg2: null, result: `goto ${endLabel}` });
              tac.push({ op: 'goto', arg1: startLabel, arg2: null, result: '' });
              tac.push({ op: 'label', arg1: endLabel, arg2: null, result: ':' });
             i = conditionEndIndex;
              // TODO: Skip body
        }
        continue;
     }

     // 5. Function Calls (very basic recognition: identifier(...); )
     if (token.type === 'IDENTIFIER' && nextToken?.value === '(') {
         let callEndIndex = i + 1;
         let parenDepth = 1;
          while (callEndIndex < tokens.length) {
             if(tokens[callEndIndex].value === '(') parenDepth++;
             if(tokens[callEndIndex].value === ')') parenDepth--;
             if(parenDepth === 0) break;
             callEndIndex++;
          }
          // Check if it's followed by a semicolon, indicating a statement call
          if (tokens[callEndIndex + 1]?.value === ';') {
               // Basic representation: param tokens are not analyzed here
              const paramTokens = tokens.slice(i + 2, callEndIndex);
              const paramCount = paramTokens.filter(t => t.type === 'IDENTIFIER' || t.type === 'NUMBER' || t.type === 'STRING').length; // Crude count

              // Generate 'param' instructions (simplified)
               paramTokens.forEach(p => {
                   if (p.type === 'IDENTIFIER' || p.type === 'NUMBER' || p.type === 'STRING') {
                       tac.push({ op: 'param', arg1: p.value, arg2: null, result: '' });
                   }
               });

              // Generate 'call' instruction
              tac.push({ op: 'call', arg1: token.value, arg2: `${paramCount}`, result: getTempVar() }); // Store potential return value
              i = callEndIndex + 1; // Move past the semicolon
              continue;
          }
          // Note: Function calls within expressions (e.g., x = func();) are harder and not handled here yet.
     }


    // Ignore other tokens for now in this simplified generator
  }

  return tac;
}

/**
 * Generates Quadruples from Three-Address Code.
 * This is generally a direct mapping for most TAC instructions.
 * Labels and gotos might be handled slightly differently depending on the target representation,
 * but here we'll map them directly.
 */
export function generateQuadruples(tac: ThreeAddressCode[]): Quadruple[] {
  const quadruples: Quadruple[] = [];

  tac.forEach((code) => {
      let op = code.op;
      let arg1 = code.arg1;
      let arg2 = code.arg2;
      let result = code.result;

      // Handle specific TAC instructions if needed
      if (op === 'label') {
          // Quadruples might represent labels differently, or just store them
          op = 'label'; // Keep it as label op
          arg1 = code.arg1; // Label name
          arg2 = null;
          result = ':'; // Convention for label quad
      } else if (op === 'goto') {
          op = 'goto';
          arg1 = code.arg1; // Target label
          arg2 = null;
          result = ''; // No result for goto
      } else if (op === 'if_false') {
           // Example: if_false t1 goto L1 => becomes (JUMP_FALSE, t1, L1, _)
           op = 'JUMP_FALSE'; // Or similar quad operation name
           arg1 = code.arg1; // Condition variable
           // Extract label from "goto L1"
           const targetLabel = code.result.startsWith('goto ') ? code.result.substring(5) : code.result;
           arg2 = targetLabel; // Target label for jump
           result = ''; // No result for conditional jump
      } else if (op === 'param') {
           op = 'param';
           arg1 = code.arg1; // Parameter value/var
           arg2 = null;
           result = '';
      } else if (op === 'call') {
          op = 'call';
          arg1 = code.arg1; // Function name
          arg2 = code.arg2; // Parameter count (optional)
          result = code.result; // Temp var for return value
      }
      // Default case (assignments, arithmetic, etc.) maps directly

      quadruples.push({ op, arg1, arg2, result });
  });

  return quadruples;
}
