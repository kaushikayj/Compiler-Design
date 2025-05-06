
import type { Token, ThreeAddressCode, Quadruple } from '@/types/compiler';

/**
 * Generates simplified Three-Address Code (TAC) from tokens.
 * This is a basic placeholder and needs significant enhancement for real-world scenarios.
 * It currently only handles simple assignments and binary operations loosely.
 */
export function generateTAC(tokens: Token[]): ThreeAddressCode[] {
  const tac: ThreeAddressCode[] = [];
  let tempVarCount = 0;

  const getTempVar = () => `t${tempVarCount++}`;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];
    const thirdToken = tokens[i + 2];
    const fourthToken = tokens[i + 3]; // For binary op

    // Basic assignment: let x = 5; or identifier = value;
    if (
        (token.type === 'KEYWORD' && (token.value === 'let' || token.value === 'const' || token.value === 'var') && nextToken?.type === 'IDENTIFIER' && thirdToken?.value === '=') ||
        (token.type === 'IDENTIFIER' && nextToken?.value === '=')
       )
    {
        const assignedVar = token.type === 'IDENTIFIER' ? token.value : nextToken.value;
        const valueToken = token.type === 'IDENTIFIER' ? thirdToken : fourthToken;

      // Simple assignment: identifier = literal/identifier
      if (valueToken && (valueToken.type === 'NUMBER' || valueToken.type === 'STRING' || valueToken.type === 'IDENTIFIER') && tokens[i + (token.type === 'IDENTIFIER' ? 2 : 3)]?.value === ';') {
        tac.push({ op: '=', arg1: valueToken.value, arg2: null, result: assignedVar });
        i += (token.type === 'IDENTIFIER' ? 2 : 3); // Skip tokens involved in assignment
      }
      // Simple binary operation assignment: identifier = arg1 op arg2;
      else if (valueToken?.type === 'IDENTIFIER' || valueToken?.type === 'NUMBER') {
           const opToken = tokens[i + (token.type === 'IDENTIFIER' ? 2 : 3)];
           const arg2Token = tokens[i + (token.type === 'IDENTIFIER' ? 3 : 4)];
           if (opToken?.type === 'OPERATOR' && (arg2Token?.type === 'IDENTIFIER' || arg2Token?.type === 'NUMBER') && tokens[i + (token.type === 'IDENTIFIER' ? 4 : 5)]?.value === ';') {
               const tempVar = getTempVar();
               tac.push({ op: opToken.value, arg1: valueToken.value, arg2: arg2Token.value, result: tempVar });
               tac.push({ op: '=', arg1: tempVar, arg2: null, result: assignedVar });
               i += (token.type === 'IDENTIFIER' ? 4 : 5); // Skip involved tokens
           }
      }
    }
    // Basic standalone binary operation (needs context, simplified)
     else if (token.type === 'IDENTIFIER' && nextToken?.type === 'OPERATOR' && thirdToken?.type === 'IDENTIFIER') {
        // This is highly simplified and doesn't handle complex expressions well
        const tempVar = getTempVar();
        tac.push({ op: nextToken.value, arg1: token.value, arg2: thirdToken.value, result: tempVar });
         // Assuming this operation stands alone or its result is used later (not handled here)
        i += 2;
     }
  }

  return tac;
}

/**
 * Generates Quadruples from Three-Address Code.
 * In this simple case, it's almost a direct mapping.
 */
export function generateQuadruples(tac: ThreeAddressCode[]): Quadruple[] {
  const quadruples: Quadruple[] = [];

  tac.forEach((code) => {
    quadruples.push({
      op: code.op,
      arg1: code.arg1,
      arg2: code.arg2,
      result: code.result,
    });
  });

  return quadruples;
}
