
"use client";

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { tokenize } from '@/lib/lexer'; // Assuming lexer logic is here
import { generateTAC, generateQuadruples } from '@/lib/intermediateCode'; // Assuming generator logic is here
import type { Token, ThreeAddressCode, Quadruple } from '@/types/compiler'; // Assuming types are defined here
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CodeAnalyzer() {
  const [sourceCode, setSourceCode] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tac, setTac] = useState<ThreeAddressCode[]>([]);
  const [quadruples, setQuadruples] = useState<Quadruple[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from context

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
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));

      const generatedTokens = tokenize(sourceCode);
      setTokens(generatedTokens);

      const generatedTac = generateTAC(generatedTokens); // Pass tokens or source code as needed
      setTac(generatedTac);

      const generatedQuads = generateQuadruples(generatedTac); // Pass TAC or tokens as needed
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
            sourceCode,
            tokens: generatedTokens, // Store the generated data
            threeAddressCode: generatedTac,
            quadruples: generatedQuads,
            timestamp: serverTimestamp(), // Use server timestamp
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
          <CardDescription>Enter your code snippet below for analysis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your source code here..."
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            className="min-h-[200px] font-mono text-sm bg-card" // Use card background for textarea
            rows={10}
            disabled={isLoading}
          />
          <Button onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
              </>
            ) : (
              'Analyze Code'
            )}
          </Button>
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
            </CardHeader>
            <CardContent>
              {tokens.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{token.type}</TableCell>
                        <TableCell>{token.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No tokens generated.</p>
              )}
            </CardContent>
          </Card>

          {/* Intermediate Code Section (TAC and Quads) */}
           <Card className="lg:col-span-2">
             <CardHeader>
                <CardTitle>Intermediate Code</CardTitle>
                <CardDescription>Generated Three-Address Code and Quadruples.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                {/* Three-Address Code Table */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Three-Address Code (TAC)</h3>
                    {tac.length > 0 ? (
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
                            <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-mono">{code.op}</TableCell>
                                <TableCell className="font-mono">{code.arg1 ?? '-'}</TableCell>
                                <TableCell className="font-mono">{code.arg2 ?? '-'}</TableCell>
                                <TableCell className="font-mono">{code.result}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    ) : (
                    <p className="text-sm text-muted-foreground">No TAC generated.</p>
                    )}
                </div>

                {/* Quadruples Table */}
                 <div>
                    <h3 className="text-lg font-semibold mb-2">Quadruples</h3>
                     {quadruples.length > 0 ? (
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
                            <TableRow key={index}>
                            <TableCell>{index}</TableCell> {/* Quadruples often start index at 0 */}
                            <TableCell className="font-mono">{quad.op}</TableCell>
                            <TableCell className="font-mono">{quad.arg1 ?? '-'}</TableCell>
                            <TableCell className="font-mono">{quad.arg2 ?? '-'}</TableCell>
                            <TableCell className="font-mono">{quad.result}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
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
