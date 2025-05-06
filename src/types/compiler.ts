
// Represents a lexical token identified by the lexer
export interface Token {
  type: TokenType; // The category of the token (e.g., KEYWORD, IDENTIFIER)
  value: string;    // The actual text/value of the token (e.g., "let", "myVar", "+")
}

// Enum or Type Alias for possible token types
export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'PUNCTUATION'
  | 'NUMBER'
  | 'STRING'
  | 'COMMENT' // Optional: if comments are treated as tokens
  | 'WHITESPACE' // Optional: if whitespace is significant
  | 'EOF' // End of File marker
  | 'UNKNOWN'; // For errors or unrecognized characters

// Represents a single instruction in Three-Address Code format
export interface ThreeAddressCode {
  op: string;       // The operation being performed (e.g., "+", "-", "*", "/", "=", "goto", "if")
  arg1: string | null; // First operand (can be an identifier, literal, or temporary variable)
  arg2: string | null; // Second operand (optional, depends on the operation)
  result: string;   // Where the result is stored (usually an identifier or temporary variable)
}

// Represents a single instruction in Quadruple format
export interface Quadruple {
  op: string;       // The operation
  arg1: string | null; // First argument/operand
  arg2: string | null; // Second argument/operand
  result: string;   // Result location
}

// Type for storing analysis history in Firestore
 export interface AnalysisHistoryItem {
   id?: string; // Firestore document ID (optional, added after retrieval)
   userId: string;
   sourceCode: string;
   tokens: Token[];
   threeAddressCode: ThreeAddressCode[];
   quadruples: Quadruple[];
   timestamp: any; // Firestore Timestamp type (or Date)
 }

