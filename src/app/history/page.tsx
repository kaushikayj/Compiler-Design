
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Inbox, Code2, Binary, ListTree, Braces } from 'lucide-react'; // Added icons
import type { AnalysisHistoryItem, Token, ThreeAddressCode, Quadruple, SymbolTable } from '@/types/compiler'; // Update type import
import { format } from 'date-fns';

// Helper function to safely format timestamp
const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    try {
        if (timestamp.toDate) { // Firestore Timestamps
            return format(timestamp.toDate(), 'PPpp'); // e.g., Jul 29, 2024, 1:30:00 PM
        }
        if (typeof timestamp === 'string' || typeof timestamp === 'number') { // Other formats
             return format(new Date(timestamp), 'PPpp');
        }
        return 'Invalid Date';
    } catch (error) {
        console.error("Error formatting timestamp:", error);
        return 'Invalid Date';
    }
};

// Helper to format language nicely
const formatLanguage = (lang: string | undefined): string => {
    if (!lang) return 'Unknown';
    switch (lang.toLowerCase()) {
        case 'c': return 'C';
        case 'cpp': return 'C++';
        case 'java': return 'Java';
        default: return lang;
    }
}

// Helper function to count symbols
const countSymbols = (symbolTable: SymbolTable | undefined): number => {
    return symbolTable ? Object.keys(symbolTable).length : 0;
}


export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const historyRef = collection(db, 'analysisHistory');
          const q = query(historyRef, where('userId', '==', user.uid), orderBy('timestamp', 'desc'));
          const querySnapshot = await getDocs(q);
          const fetchedHistory: AnalysisHistoryItem[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Map Firestore data to AnalysisHistoryItem, ensuring all fields exist
            fetchedHistory.push({
                id: doc.id,
                userId: data.userId || '',
                language: data.language || 'unknown',
                sourceCode: data.sourceCode || '',
                tokens: data.tokens || [],
                threeAddressCode: data.threeAddressCode || [],
                quadruples: data.quadruples || [],
                symbolTable: data.symbolTable || {}, // Add symbol table, default to empty object
                timestamp: data.timestamp || null,
            });
          });
          setHistory(fetchedHistory);
        } catch (err) {
          console.error("Error fetching history:", err);
          setError("Failed to load analysis history. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();
    } else {
      setIsLoading(false);
       setHistory([]);
    }
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Analysis History</h1>

        {isLoading && (
          <div className="space-y-4">
             <Skeleton className="h-28 w-full rounded-lg" />
             <Skeleton className="h-28 w-full rounded-lg" />
             <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        )}

        {!isLoading && error && (
           <Card className="border-destructive bg-destructive/10">
             <CardHeader className="flex flex-row items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <CardTitle className="text-destructive">Error Loading History</CardTitle>
             </CardHeader>
              <CardContent>
                <p className="text-destructive">{error}</p>
              </CardContent>
           </Card>
        )}

        {!isLoading && !error && !user && (
          <Card>
            <CardHeader>
                <CardTitle>Please Log In</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You need to be logged in to view your analysis history.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && user && history.length === 0 && (
          <Card className="text-center py-10 border-dashed">
            <CardHeader>
                <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle className="mt-4">No History Yet</CardTitle>
            </CardHeader>
             <CardContent>
                 <p className="text-muted-foreground">You haven't analyzed any code yet. Go back to the main page to start!</p>
             </CardContent>
          </Card>
        )}


        {!isLoading && !error && user && history.length > 0 && (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {history.map((item, index) => (
              <AccordionItem key={item.id || index} value={`item-${index}`} className="bg-card rounded-lg shadow-sm border">
                <AccordionTrigger className="hover:no-underline py-4 px-4 text-sm sm:text-base">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2 sm:gap-4">
                       <div className="flex items-center gap-2 flex-shrink min-w-0">
                            <Code2 className="w-4 h-4 text-muted-foreground flex-shrink-0"/>
                            <span className="font-medium text-primary truncate">{formatLanguage(item.language)} Analysis</span>
                       </div>
                       <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 w-full sm:w-auto text-left sm:text-right text-xs sm:text-sm">
                            <span className="text-muted-foreground flex-shrink-0">{formatTimestamp(item.timestamp)}</span>
                            <span className="text-muted-foreground">{item.tokens?.length || 0} tokens</span>
                            <span className="text-muted-foreground">{countSymbols(item.symbolTable)} symbols</span>
                       </div>
                   </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4 space-y-6">
                   {/* Source Code */}
                  <div>
                    <h4 className="text-md font-semibold mb-2">Source Code ({formatLanguage(item.language)})</h4>
                     <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/50 p-3">
                        <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                          {item.sourceCode || 'No source code recorded.'}
                        </pre>
                    </ScrollArea>
                  </div>

                  {/* Analysis Results Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                      {/* Left Column: Tokens & Symbol Table */}
                      <div className="space-y-6">
                          {/* Tokens */}
                          <div>
                              <h4 className="text-md font-semibold mb-2 flex items-center gap-2"><Braces className="w-4 h-4 text-muted-foreground"/> Tokens ({item.tokens?.length || 0})</h4>
                              {item.tokens && item.tokens.length > 0 ? (
                                  <ScrollArea className="h-[300px] border rounded-md">
                                      <Table>
                                          <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm">
                                              <TableRow>
                                                  <TableHead>Type</TableHead>
                                                  <TableHead>Value</TableHead>
                                                  <TableHead className="text-right">Line</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {item.tokens.map((token, tIndex) => (
                                                  <TableRow key={`token-${index}-${tIndex}`}>
                                                      <TableCell className="font-medium">{token.type}</TableCell>
                                                      <TableCell className="font-mono break-all">{token.value === '\n' ? '\\n' : token.value}</TableCell>
                                                       <TableCell className="text-right text-muted-foreground">{token.line ?? '-'}</TableCell>
                                                  </TableRow>
                                              ))}
                                          </TableBody>
                                      </Table>
                                  </ScrollArea>
                              ) : <p className="text-sm text-muted-foreground p-4 border rounded-md">No tokens recorded.</p>}
                          </div>

                           {/* Symbol Table */}
                           <div>
                              <h4 className="text-md font-semibold mb-2 flex items-center gap-2"><ListTree className="w-4 h-4 text-muted-foreground"/> Symbol Table ({countSymbols(item.symbolTable)})</h4>
                                {item.symbolTable && countSymbols(item.symbolTable) > 0 ? (
                                    <ScrollArea className="h-[300px] border rounded-md">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm">
                                                <TableRow>
                                                    <TableHead>Identifier</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Scope</TableHead>
                                                    {/* Add other columns if they exist in your data */}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Object.entries(item.symbolTable).map(([name, entry]) => (
                                                    <TableRow key={`symbol-${index}-${name}`}>
                                                        <TableCell className="font-mono font-semibold">{name}</TableCell>
                                                        <TableCell>{entry.type ?? 'unknown'}</TableCell>
                                                        <TableCell>{entry.scope ?? 'global'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                ) : <p className="text-sm text-muted-foreground p-4 border rounded-md">No Symbol Table recorded.</p>}
                           </div>
                      </div>

                       {/* Right Column: Intermediate Code */}
                       <div className="space-y-6">
                           {/* Three-Address Code */}
                           <div>
                              <h4 className="text-md font-semibold mb-2 flex items-center gap-2"><Binary className="w-4 h-4 text-muted-foreground"/> Three-Address Code ({item.threeAddressCode?.length || 0})</h4>
                                {item.threeAddressCode && item.threeAddressCode.length > 0 ? (
                                 <ScrollArea className="h-[300px] border rounded-md">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm">
                                            <TableRow>
                                                <TableHead>#</TableHead>
                                                <TableHead>Op</TableHead>
                                                <TableHead>Arg1</TableHead>
                                                <TableHead>Arg2</TableHead>
                                                <TableHead>Result</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {item.threeAddressCode.map((code, cIndex) => (
                                            <TableRow key={`tac-${index}-${cIndex}`}>
                                                <TableCell className="w-[50px] text-muted-foreground">{cIndex + 1}</TableCell>
                                                <TableCell className="font-mono">{code.op}</TableCell>
                                                <TableCell className="font-mono">{code.arg1 ?? '—'}</TableCell>
                                                <TableCell className="font-mono">{code.arg2 ?? '—'}</TableCell>
                                                <TableCell className="font-mono font-semibold">{code.result}</TableCell>
                                            </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                 </ScrollArea>
                                ) : <p className="text-sm text-muted-foreground p-4 border rounded-md">No TAC recorded.</p>}
                           </div>

                           {/* Quadruples */}
                            <div>
                              <h4 className="text-md font-semibold mb-2 flex items-center gap-2"><Binary className="w-4 h-4 text-muted-foreground"/> Quadruples ({item.quadruples?.length || 0})</h4>
                                {item.quadruples && item.quadruples.length > 0 ? (
                                 <ScrollArea className="h-[300px] border rounded-md">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-sm">
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Op</TableHead>
                                            <TableHead>Arg1</TableHead>
                                            <TableHead>Arg2</TableHead>
                                            <TableHead>Result</TableHead>
                                        </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {item.quadruples.map((quad, qIndex) => (
                                            <TableRow key={`quad-${index}-${qIndex}`}>
                                            <TableCell className="w-[50px] text-muted-foreground">{qIndex}</TableCell>
                                            <TableCell className="font-mono">{quad.op}</TableCell>
                                            <TableCell className="font-mono">{quad.arg1 ?? '—'}</TableCell>
                                            <TableCell className="font-mono">{quad.arg2 ?? '—'}</TableCell>
                                            <TableCell className="font-mono font-semibold">{quad.result}</TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                 </ScrollArea>
                                ) : <p className="text-sm text-muted-foreground p-4 border rounded-md">No Quadruples recorded.</p>}
                            </div>
                         </div> {/* End Right Column */}
                   </div> {/* End Grid */}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
       <footer className="py-4 text-center text-sm text-muted-foreground border-t">
         © {new Date().getFullYear()} Code Insights. All rights reserved.
       </footer>
    </div>
  );
}
