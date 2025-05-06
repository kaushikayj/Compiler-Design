
"use client";

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play } from 'lucide-react';
import { tokenize } from '@/lib/lexer'; // Assuming lexer logic is here
import { generateTAC, generateQuadruples } from '@/lib/intermediateCode'; // Assuming generator logic is here
import type { Token, ThreeAddressCode, Quadruple, Language } from '@/types/compiler'; // Assuming types are defined here
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const sampleCode: Record<Language, string> = {
    c: `#include <stdio.h>

int main() {
    int a = 5;
    int b = 10;
    int sum = a + b;
    printf("Sum: %d\\n", sum);
    if (sum > 10) {
        printf("Sum is greater than 10\\n");
    }
    return 0;
}`,
    cpp: `#include <iostream>

int main() {
    int a = 5;
    int b = 10;
    int sum = a + b;
    std::cout << "Sum: " << sum << std::endl;
    if (sum > 10) {
        std::cout << "Sum is greater than 10" << std::endl;
    }
    return 0;
}`,
    java: `public class Main {
    public static void main(String[] args) {
        int a = 5;
        int b = 10;
        int sum = a + b;
        System.out.println("Sum: " + sum);
        if (sum > 10) {
            System.out.println("Sum is greater than 10");
        }
    }
}`,
};


export default function CodeAnalyzer() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('c');
  const [sourceCode, setSourceCode] = useState(sampleCode.c);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tac, setTac] = useState<ThreeAddressCode[]>([]);
  const [quadruples, setQuadruples] = useState<Quadruple[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from context

  useEffect(() => {
    // Update sample code when language changes
    setSourceCode(sampleCode[selectedLanguage]);
    // Clear previous results when language changes
    setTokens([]);
    setTac([]);
    setQuadruples([]);
  }, [selectedLanguage]);

  const handleLanguageChange = (value: string) => {
      // Type assertion needed because SelectValue can be any string
     setSelectedLanguage(value as Language);
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
    setTokens([]);
    setTac([]);
    setQuadruples([]);

    try {
      // Simulate processing time - replace with actual analysis logic
      await new Promise(resolve => setTimeout(resolve, 500));

      // Note: Current lexer/intermediate code generation is language-agnostic
      // In a real compiler, these would depend heavily on the selectedLanguage
      const generatedTokens = tokenize(sourceCode);
      setTokens(generatedTokens);

      const generatedTac = generateTAC(generatedTokens);
      setTac(generatedTac);

      const generatedQuads = generateQuadruples(generatedTac);
      setQuadruples(generatedQuads);

       toast({
         title: 'Analysis Complete',
         description: 'Tokens and intermediate code generated.',
       });

      // Save to Firestore if user is logged in
      if (user) {
        try {
          await addDoc(collection(db, 'analysisHistory'), {
            userId: user.uid,
            language: selectedLanguage, // Save selected language
            sourceCode,
            tokens: generatedTokens,
            threeAddressCode: generatedTac,
            quadruples: generatedQuads,
            timestamp: serverTimestamp(),
          });
           toast({
             title: 'History Saved',
             description: 'Analysis results saved to your history.',
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
      toast({
        title: 'Analysis Error',
        description: error.message || 'An unexpected error occurred during analysis.',
        variant: 'destructive',
      });
       // Clear results on error
       setTokens([]);
       setTac([]);
       setQuadruples([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Source Code Input</CardTitle>
          <CardDescription>Select a language and enter or modify the code snippet below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="w-full sm:w-auto flex-grow">
                    <Label htmlFor="language-select" className="mb-2 block">Language</Label>
                    <Select value={selectedLanguage} onValueChange={handleLanguageChange} disabled={isLoading}>
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
                 <Button onClick={handleAnalyze} disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                    </>
                    ) : (
                     <>
                        <Play className="mr-2 h-4 w-4" /> Analyze Code
                     </>
                    )}
                 </Button>
            </div>
          <Textarea
            placeholder="Enter your source code here..."
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            className="min-h-[250px] font-mono text-sm bg-muted" // Use muted background
            rows={15}
            disabled={isLoading}
          />

        </CardContent>
      </Card>

      {isLoading && (
         <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Processing...</span>
         </div>
      )}

      {!isLoading && (tokens.length > 0 || tac.length > 0 || quadruples.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tokens Table */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Tokens</CardTitle>
                 <CardDescription>{tokens.length} tokens identified</CardDescription>
            </CardHeader>
            <CardContent>
              {tokens.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4"> {/* Added ScrollArea */}
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tokens.map((token, index) => (
                        <TableRow key={`token-${index}`}>
                            <TableCell className="font-medium">{token.type}</TableCell>
                            <TableCell className="font-mono break-all">{token.value}</TableCell>
                         </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                 </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No tokens generated.</p>
              )}
            </CardContent>
          </Card>

          {/* Intermediate Code Section (TAC and Quads) */}
           <Card className="lg:col-span-2">
             <CardHeader>
                <CardTitle>Intermediate Code</CardTitle>
                <CardDescription>Generated Three-Address Code (TAC) and Quadruples.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                {/* Three-Address Code Table */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Three-Address Code ({tac.length})</h3>
                    {tac.length > 0 ? (
                     <ScrollArea className="h-[200px] pr-4"> {/* Added ScrollArea */}
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Operation</TableHead>
                                <TableHead>Arg1</TableHead>
                                <TableHead>Arg2</TableHead>
                                <TableHead>Result</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {tac.map((code, index) => (
                                <TableRow key={`tac-${index}`}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-mono">{code.op}</TableCell>
                                    <TableCell className="font-mono">{code.arg1 ?? '-'}</TableCell>
                                    <TableCell className="font-mono">{code.arg2 ?? '-'}</TableCell>
                                    <TableCell className="font-mono">{code.result}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                     </ScrollArea>
                    ) : (
                    <p className="text-sm text-muted-foreground">No TAC generated.</p>
                    )}
                </div>

                {/* Quadruples Table */}
                 <div>
                    <h3 className="text-lg font-semibold mb-2">Quadruples ({quadruples.length})</h3>
                     {quadruples.length > 0 ? (
                       <ScrollArea className="h-[200px] pr-4"> {/* Added ScrollArea */}
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Operation</TableHead>
                                    <TableHead>Arg1</TableHead>
                                    <TableHead>Arg2</TableHead>
                                    <TableHead>Result</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {quadruples.map((quad, index) => (
                                    <TableRow key={`quad-${index}`}>
                                    <TableCell>{index}</TableCell> {/* Quadruples often start index at 0 */}
                                    <TableCell className="font-mono">{quad.op}</TableCell>
                                    <TableCell className="font-mono">{quad.arg1 ?? '-'}</TableCell>
                                    <TableCell className="font-mono">{quad.arg2 ?? '-'}</TableCell>
                                    <TableCell className="font-mono">{quad.result}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    ) : (
                    <p className="text-sm text-muted-foreground">No Quadruples generated.</p>
                    )}
                 </div>
             </CardContent>
           </Card>
        </div>
      )}
    </div>
  );
}

// Dummy ScrollArea component if not already imported/available
// Replace with actual import if using shadcn/ui ScrollArea
// import { ScrollArea } from "@/components/ui/scroll-area";

// If ScrollArea is not part of shadcn/ui install, use this basic div or install it:
// npx shadcn-ui@latest add scroll-area
const ScrollArea = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={cn("overflow-auto", className)}>
      {children}
    </div>
);
import { cn } from "@/lib/utils"; // Assuming utils exists

