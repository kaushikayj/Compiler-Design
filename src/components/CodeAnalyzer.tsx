
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Trash2, Wand2, AlertCircle } from 'lucide-react';
import { tokenize } from '@/lib/lexer';
import { generateTAC, generateQuadruples } from '@/lib/intermediateCode';
import { generateSymbolTable } from '@/lib/symbolTable'; // Import symbol table generator
import type { Token, ThreeAddressCode, Quadruple, Language, SymbolTable, AnalysisResult } from '@/types/compiler';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { explainCode } from '@/ai/flows/explain-code-flow'; // Import the AI flow

// More complex sample code examples
const sampleCode: Record<Language, string> = {
    c: `#include <stdio.h>

// Function to calculate factorial
int factorial(int n) {
    if (n <= 1) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}

int main() {
    int num = 5;
    int result = 0;
    int i = 0;

    printf("Calculating factorial of %d\\n", num);
    result = factorial(num);
    printf("Factorial: %d\\n", result);

    // Simple loop
    printf("Counting up to 3:\\n");
    while (i < 3) {
        printf("i = %d\\n", i);
        i++;
    }

    return 0;
}`,
    cpp: `#include <iostream>
#include <vector>
#include <string>

class Greeter {
public:
    std::string message;
    Greeter(std::string msg) : message(msg) {}

    void greet() {
        std::cout << message << std::endl;
    }
};

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    int sum = 0;

    for (int num : numbers) {
        sum += num;
    }

    std::cout << "Sum of vector elements: " << sum << std::endl;

    if (sum > 10) {
        Greeter hello("Hello from C++!");
        hello.greet();
    }

    int x = 10;
    int* ptr = &x;
    std::cout << "Value via pointer: " << *ptr << std::endl;


    return 0;
}`,
    java: `import java.util.ArrayList;
import java.util.List;

class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    // Overloaded method
    public double add(double a, double b) {
        return a + b;
    }
}

public class Main {
    public static void main(String[] args) {
        Calculator calc = new Calculator();
        int intSum = calc.add(5, 10);
        double doubleSum = calc.add(2.5, 3.7);

        System.out.println("Integer Sum: " + intSum);
        System.out.println("Double Sum: " + doubleSum);

        List<String> names = new ArrayList<>();
        names.add("Alice");
        names.add("Bob");

        System.out.println("Names:");
        for (String name : names) {
            System.out.println("- " + name);
        }

        try {
            int result = 10 / (args.length > 0 ? Integer.parseInt(args[0]) : 0); // Potential division by zero
            System.out.println("Result: " + result);
        } catch (ArithmeticException e) {
            System.err.println("Error: Division by zero!");
        } catch (NumberFormatException e) {
             System.err.println("Error: Invalid number format!");
        }
    }
}`,
};


export default function CodeAnalyzer() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('c');
  const [sourceCode, setSourceCode] = useState(sampleCode.c);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setSourceCode(sampleCode[selectedLanguage]);
    clearResults(); // Clear results when language changes
  }, [selectedLanguage]);

  const clearResults = useCallback(() => {
      setAnalysisResult(null);
      setAiExplanation(null);
      setAnalysisError(null);
      setExplanationError(null);
  }, []);


  const handleLanguageChange = (value: string) => {
     setSelectedLanguage(value as Language);
     // Keep source code if manually edited, otherwise load sample
     // This logic might need refinement based on desired UX
      if (sourceCode !== sampleCode.c && sourceCode !== sampleCode.cpp && sourceCode !== sampleCode.java) {
         // User has likely edited the code, don't overwrite
      } else {
         setSourceCode(sampleCode[value as Language]);
      }
       clearResults();
  };

  const handleClear = () => {
      setSourceCode('');
      clearResults();
      toast({ title: 'Cleared', description: 'Input and results cleared.' });
  };


  const handleAnalyze = async () => {
    if (!sourceCode.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter some source code to analyze.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    clearResults(); // Clear previous results before new analysis

    try {
        // Simulate processing time if needed, or rely on actual function execution time
        // await new Promise(resolve => setTimeout(resolve, 300));

        // Perform analysis steps
        const tokens = tokenize(sourceCode);
        const tac = generateTAC(tokens); // Pass tokens
        const quads = generateQuadruples(tac); // Pass TAC
        const symTable = generateSymbolTable(tokens); // Generate symbol table

        const newResult: AnalysisResult = { tokens, threeAddressCode: tac, quadruples: quads, symbolTable: symTable };
        setAnalysisResult(newResult);

        toast({
         title: 'Analysis Complete',
         description: 'Tokens, intermediate code, and symbol table generated.',
        });

      // Save to Firestore if user is logged in
      if (user) {
        try {
          await addDoc(collection(db, 'analysisHistory'), {
            userId: user.uid,
            language: selectedLanguage,
            sourceCode,
            tokens: newResult.tokens,
            threeAddressCode: newResult.threeAddressCode,
            quadruples: newResult.quadruples,
            symbolTable: newResult.symbolTable, // Save symbol table
            timestamp: serverTimestamp(),
          });
           toast({
             title: 'History Saved',
             description: 'Analysis results saved to your history.',
             variant: "default", // Use default variant for success
           });
        } catch (error) {
          console.error("Error saving analysis to Firestore: ", error);
          toast({
            title: 'Firestore Error',
            description: 'Could not save analysis history. Please try again.',
            variant: 'destructive',
          });
        }
      }

    } catch (error: any) {
      console.error("Analysis Error:", error);
      const errorMessage = error.message || 'An unexpected error occurred during analysis.';
      setAnalysisError(errorMessage); // Set specific analysis error
      toast({
        title: 'Analysis Error',
        description: errorMessage,
        variant: 'destructive',
      });
       // Ensure results are cleared on error
       setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  };

   const handleExplain = async () => {
       if (!analysisResult || !sourceCode) {
           toast({
               title: 'Analysis Required',
               description: 'Please analyze the code first before requesting an explanation.',
               variant: 'destructive',
           });
           return;
       }

       setIsExplaining(true);
       setAiExplanation(null); // Clear previous explanation
       setExplanationError(null); // Clear previous error

       try {
           const explanation = await explainCode({
               language: selectedLanguage,
               sourceCode: sourceCode,
               tokens: analysisResult.tokens,
               threeAddressCode: analysisResult.threeAddressCode,
               quadruples: analysisResult.quadruples,
               symbolTable: analysisResult.symbolTable,
           });

           setAiExplanation(explanation.explanation);
           toast({
               title: 'Explanation Generated',
               description: 'AI explanation provided below.',
           });

       } catch (error: any) {
           console.error("AI Explanation Error:", error);
           const errorMsg = error.message || "Failed to get explanation from AI.";
           setExplanationError(errorMsg);
           toast({
               title: 'Explanation Error',
               description: errorMsg,
               variant: 'destructive',
           });
       } finally {
           setIsExplaining(false);
       }
   };


  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Compiler Design Toolkit</CardTitle>
          <CardDescription>Enter code, select language, and analyze to see tokens, intermediate code, and symbol table. Use the AI Explain feature for insights.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
                {/* Left side: Language Select */}
                <div className="w-full sm:w-auto">
                    <Label htmlFor="language-select" className="mb-2 block">Language</Label>
                    <Select value={selectedLanguage} onValueChange={handleLanguageChange} disabled={isLoading || isExplaining}>
                        <SelectTrigger id="language-select" className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="c">C</SelectItem>
                            <SelectItem value="cpp">C++</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* Right side: Action Buttons */}
                 <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                     <Button onClick={handleClear} variant="outline" disabled={isLoading || isExplaining} className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" /> Clear
                     </Button>
                     <Button onClick={handleAnalyze} disabled={isLoading || isExplaining} className="w-full sm:w-auto">
                        {isLoading ? (
                            <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing... </>
                        ) : (
                            <> <Play className="mr-2 h-4 w-4" /> Analyze Code </>
                        )}
                     </Button>
                      <Button
                          onClick={handleExplain}
                          disabled={isLoading || isExplaining || !analysisResult || !!analysisError}
                          className="w-full sm:w-auto"
                          variant="secondary"
                      >
                          {isExplaining ? (
                              <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Explaining... </>
                          ) : (
                              <> <Wand2 className="mr-2 h-4 w-4" /> AI Explain </>
                          )}
                      </Button>
                 </div>
            </div>
          <Textarea
            placeholder="Enter your source code here..."
            value={sourceCode}
            onChange={(e) => {
                setSourceCode(e.target.value);
                 // Optionally clear results if code changes after analysis
                 // if (analysisResult) {
                 //    clearResults();
                 // }
            }}
            className="min-h-[300px] font-mono text-sm bg-muted/50 border rounded-md p-3 focus:ring-2 focus:ring-primary/50"
            rows={15}
            disabled={isLoading || isExplaining}
          />
        </CardContent>
      </Card>

       {/* Loading Indicator */}
        {isLoading && (
         <Card className="flex items-center justify-center p-6 border-dashed">
             <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
             <span className="text-muted-foreground">Analyzing code...</span>
         </Card>
        )}

        {/* Analysis Error Display */}
        {!isLoading && analysisError && (
            <Card className="border-destructive bg-destructive/10">
                <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <CardTitle className="text-destructive text-lg">Analysis Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive text-sm">{analysisError}</p>
                    <p className="text-xs text-destructive/80 mt-1">Please check your code for syntax errors or unsupported features.</p>
                </CardContent>
            </Card>
        )}


      {/* Results Section */}
      {!isLoading && !analysisError && analysisResult && (
        <Card>
           <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>Explore the generated tokens, intermediate code representations, and symbol table.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="tokens" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="tokens">Tokens ({analysisResult.tokens?.length ?? 0})</TabsTrigger>
                        <TabsTrigger value="tac">TAC ({analysisResult.threeAddressCode?.length ?? 0})</TabsTrigger>
                        <TabsTrigger value="quads">Quadruples ({analysisResult.quadruples?.length ?? 0})</TabsTrigger>
                        <TabsTrigger value="symbolTable">Symbol Table ({Object.keys(analysisResult.symbolTable ?? {}).length})</TabsTrigger>
                    </TabsList>

                    {/* Tokens Tab */}
                    <TabsContent value="tokens">
                        <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="text-lg">Lexical Tokens</CardTitle>
                                <CardDescription>The sequence of tokens identified from the source code.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {analysisResult.tokens && analysisResult.tokens.length > 0 ? (
                                <ScrollArea className="h-[400px] pr-4 border rounded-md">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-card">
                                            <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Value</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analysisResult.tokens.map((token, index) => (
                                            <TableRow key={`token-${index}`}>
                                                <TableCell className="font-medium">{token.type}</TableCell>
                                                <TableCell className="font-mono break-all">{token.value === '\n' ? '\\n' : token.value}</TableCell>
                                            </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                                ) : (
                                <p className="text-sm text-muted-foreground p-4 border rounded-md">No tokens generated.</p>
                                )}
                            </CardContent>
                         </Card>
                    </TabsContent>

                    {/* Three-Address Code Tab */}
                    <TabsContent value="tac">
                        <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="text-lg">Three-Address Code (TAC)</CardTitle>
                                <CardDescription>A form of intermediate code where each instruction has at most three addresses.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {analysisResult.threeAddressCode && analysisResult.threeAddressCode.length > 0 ? (
                                <ScrollArea className="h-[400px] pr-4 border rounded-md">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-card">
                                            <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Operation</TableHead>
                                            <TableHead>Arg1</TableHead>
                                            <TableHead>Arg2</TableHead>
                                            <TableHead>Result</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analysisResult.threeAddressCode.map((code, index) => (
                                            <TableRow key={`tac-${index}`}>
                                                <TableCell className="text-muted-foreground w-[50px]">{index + 1}</TableCell>
                                                <TableCell className="font-mono">{code.op}</TableCell>
                                                <TableCell className="font-mono">{code.arg1 ?? '—'}</TableCell>
                                                <TableCell className="font-mono">{code.arg2 ?? '—'}</TableCell>
                                                <TableCell className="font-mono font-semibold">{code.result}</TableCell>
                                            </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                                ) : (
                                <p className="text-sm text-muted-foreground p-4 border rounded-md">No TAC generated.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Quadruples Tab */}
                    <TabsContent value="quads">
                        <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="text-lg">Quadruples</CardTitle>
                                 <CardDescription>Intermediate code where each instruction has exactly four fields: operator, two operands, and a result.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {analysisResult.quadruples && analysisResult.quadruples.length > 0 ? (
                                <ScrollArea className="h-[400px] pr-4 border rounded-md">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-card">
                                            <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Operation</TableHead>
                                            <TableHead>Arg1</TableHead>
                                            <TableHead>Arg2</TableHead>
                                            <TableHead>Result</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analysisResult.quadruples.map((quad, index) => (
                                            <TableRow key={`quad-${index}`}>
                                                <TableCell className="text-muted-foreground w-[50px]">{index}</TableCell>
                                                <TableCell className="font-mono">{quad.op}</TableCell>
                                                <TableCell className="font-mono">{quad.arg1 ?? '—'}</TableCell>
                                                <TableCell className="font-mono">{quad.arg2 ?? '—'}</TableCell>
                                                <TableCell className="font-mono font-semibold">{quad.result}</TableCell>
                                            </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                                ) : (
                                <p className="text-sm text-muted-foreground p-4 border rounded-md">No Quadruples generated.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                     {/* Symbol Table Tab */}
                    <TabsContent value="symbolTable">
                         <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="text-lg">Symbol Table</CardTitle>
                                <CardDescription>Stores information about identifiers (variables, functions, etc.) used in the code.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                {analysisResult.symbolTable && Object.keys(analysisResult.symbolTable).length > 0 ? (
                                 <ScrollArea className="h-[400px] pr-4 border rounded-md">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-card">
                                            <TableRow>
                                                <TableHead>Identifier</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Scope</TableHead>
                                                {/* Add more columns as needed, e.g., Value, Line Declared */}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Object.entries(analysisResult.symbolTable).map(([name, entry]) => (
                                                <TableRow key={`symbol-${name}`}>
                                                    <TableCell className="font-mono font-semibold">{name}</TableCell>
                                                    <TableCell>{entry.type ?? 'unknown'}</TableCell>
                                                    <TableCell>{entry.scope ?? 'global'}</TableCell>
                                                    {/* Render additional properties here */}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                 </ScrollArea>
                                ) : (
                                    <p className="text-sm text-muted-foreground p-4 border rounded-md">Symbol Table is empty or not generated.</p>
                                )}
                             </CardContent>
                         </Card>
                    </TabsContent>

                </Tabs>
            </CardContent>
        </Card>
      )}

       {/* AI Explanation Section */}
      {(isExplaining || aiExplanation || explanationError) && (
         <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    AI Explanation
                </CardTitle>
                 <CardDescription>An AI-generated explanation of the analyzed code and its components.</CardDescription>
             </CardHeader>
             <CardContent>
                 {isExplaining && (
                     <div className="flex items-center justify-center p-6 border-dashed rounded-md">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        <span className="text-muted-foreground">Generating explanation...</span>
                    </div>
                 )}
                  {!isExplaining && explanationError && (
                    <div className="border-destructive bg-destructive/10 p-4 rounded-md">
                       <div className="flex items-center space-x-2 mb-1">
                            <AlertCircle className="w-5 h-5 text-destructive" />
                            <h4 className="text-destructive font-semibold">Explanation Error</h4>
                       </div>
                        <p className="text-destructive text-sm">{explanationError}</p>
                    </div>
                 )}
                 {!isExplaining && aiExplanation && !explanationError && (
                    <ScrollArea className="h-[300px] w-full rounded-md border bg-muted/30 p-4">
                        <pre className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {aiExplanation}
                        </pre>
                    </ScrollArea>
                 )}
             </CardContent>
         </Card>
      )}

    </div>
  );
}
