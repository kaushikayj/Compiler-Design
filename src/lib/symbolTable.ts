
import type { Token, SymbolTable, SymbolTableEntry } from '@/types/compiler';

/**
 * Generates a very basic symbol table from tokens.
 * This is a placeholder and needs significant improvement for real-world accuracy.
 * It mainly identifies identifiers declared with common keywords (let, const, var, int, float, String, etc.)
 * and basic function definitions. Scope handling is extremely rudimentary.
 */
export function generateSymbolTable(tokens: Token[]): SymbolTable {
    const symbolTable: SymbolTable = {};
    let currentScope = 'global'; // Very basic scope tracking

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const nextToken = tokens[i + 1];
        const prevToken = tokens[i - 1];

        // Rudimentary function scope detection (simplistic)
        if (token.type === 'IDENTIFIER' && nextToken?.value === '(' && (prevToken?.type === 'KEYWORD' && ['void', 'int', 'float', 'double', 'String', 'auto'].includes(prevToken.value)) || (prevToken?.type === 'IDENTIFIER')) {
             // Very basic function definition pattern (e.g., int func(...) or Class::func(...) )
             // Does not handle complex C++ namespaces or Java classes properly
            currentScope = token.value; // Use function name as scope (oversimplified)
             // Add function identifier itself to symbol table
             if (!symbolTable[token.value]) {
                  symbolTable[token.value] = {
                      name: token.value,
                      type: `${prevToken?.value ?? 'unknown'} function`, // Basic type inference
                      scope: 'global', // Assume global for now, needs refinement
                  };
             }
            // TODO: Parse parameters within parentheses for more detail
        } else if (token.value === '{' && currentScope !== 'global') {
            // Entering a block, could refine scope further, but keeping it simple
        } else if (token.value === '}') {
             // Potentially exiting a scope; reset to global if it was a function's top-level block
             // This logic is flawed for nested blocks. Needs proper scope stack.
            if (currentScope !== 'global' /* && isMatchingFunctionBlockEnd */) {
                 currentScope = 'global';
            }
        }

        // Variable Declaration Detection (very basic)
        // Looks for patterns like: type identifier; or type identifier = value;
        if (token.type === 'KEYWORD' && ['let', 'const', 'var', 'int', 'float', 'double', 'char', 'String', 'std::string', 'auto', 'boolean', 'byte', 'short', 'long'].includes(token.value)) {
            if (nextToken?.type === 'IDENTIFIER') {
                const identifierName = nextToken.value;
                const thirdToken = tokens[i + 2];

                 // Avoid re-declaring if already exists in the current basic scope
                 // A proper implementation needs hierarchical scope checking.
                if (!symbolTable[identifierName] || symbolTable[identifierName].scope !== currentScope) {
                    symbolTable[identifierName] = {
                        name: identifierName,
                        type: token.value, // Use the keyword as the type (simplistic)
                        scope: currentScope,
                        // lineDeclared: token.line, // Add line number if available
                    };
                }
                // Skip the identifier token since we processed it
                i++;
                 // Skip assignment if present (= value)
                 if (thirdToken?.value === '=') {
                     // Skip the '=' and the value/expression part (basic skip)
                     let j = i + 2;
                     while (j < tokens.length && tokens[j].value !== ';') {
                         j++;
                     }
                     i = j; // Move index past the assignment
                 }
            }
        }
          // Handle C++ class member declaration (extremely basic)
         else if (token.type === 'IDENTIFIER' && prevToken?.value === 'class') {
              // Class declaration: class MyClass { ... }
              currentScope = token.value; // Enter class scope (basic)
              if (!symbolTable[token.value]) {
                  symbolTable[token.value] = { name: token.value, type: 'class', scope: 'global' }; // Assume global for class definition
              }
         }
         // Handle simple C++ namespace alias (e.g., using namespace std;) - just notes it
          else if (token.type === 'KEYWORD' && token.value === 'using' && nextToken?.type === 'KEYWORD' && nextToken.value === 'namespace') {
              const namespaceName = tokens[i+2]?.value;
              if (namespaceName && !symbolTable[`using_namespace_${namespaceName}`]) {
                   symbolTable[`using_namespace_${namespaceName}`] = { name: `using namespace ${namespaceName}`, type: 'directive', scope: currentScope };
              }
              i += 2; // Skip 'namespace' and the name
          }


        // Add more rules here for other declaration types (structs, enums, classes, etc.)
        // This requires more sophisticated parsing than simple token lookahead.
    }

    return symbolTable;
}
