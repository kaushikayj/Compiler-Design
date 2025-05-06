

// Represents a lexical token identified by the lexer
export interface Token {
  type: TokenType; // The category of the token (e.g., KEYWORD, IDENTIFIER)
  value: string;    // The actual text/value of the token (e.g., "let", "myVar", "+")
  line?: number; // Optional: Line number where the token appears
  column?: number; // Optional: Column number where the token starts
}

// Enum or Type Alias for possible token types
export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'PUNCTUATION'
  | 'NUMBER'
  | 'STRING'
  | 'CHARACTER' // Added character type
  | 'COMMENT' // Optional: if comments are treated as tokens
  | 'WHITESPACE' // Optional: if whitespace is significant
  | 'PREPROCESSOR' // Added for C/C++ #include etc.
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

// Supported languages
export type Language = 'c' | 'cpp' | 'java';

// Represents an entry in the Symbol Table
export interface SymbolTableEntry {
    name: string;         // Identifier name
    type: string;         // Data type (e.g., 'int', 'float', 'string', 'function', 'class')
    scope: string;        // Scope where defined (e.g., 'global', 'main', function name)
    // Add other relevant info:
    // value?: any;       // Initial or current value (if applicable)
    // lineDeclared?: number; // Line number of declaration
    // isFunction?: boolean;
    // parameters?: SymbolTableEntry[]; // For functions
    // members?: SymbolTable; // For classes/structs
}

// Represents the Symbol Table itself (mapping identifier names to entries)
export type SymbolTable = Record<string, SymbolTableEntry>;

// Combined result of the analysis process
export interface AnalysisResult {
    tokens: Token[];
    threeAddressCode: ThreeAddressCode[];
    quadruples: Quadruple[];
    symbolTable: SymbolTable;
}


// Type for storing analysis history in Firestore
 export interface AnalysisHistoryItem extends AnalysisResult { // Inherit from AnalysisResult
   id?: string; // Firestore document ID (optional, added after retrieval)
   userId: string;
   language: Language;
   sourceCode: string;
   timestamp: any; // Firestore Timestamp type (or Date)
 }

