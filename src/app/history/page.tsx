
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
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
import { AlertCircle, Inbox, Code2 } from 'lucide-react';
import type { AnalysisHistoryItem, Token, ThreeAddressCode, Quadruple } from '@/types/compiler'; // Assuming types are defined here
import { format } from 'date-fns'; // For formatting timestamps

// Helper function to safely format timestamp
const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    try {
        // Firestore Timestamps have toDate() method
        if (timestamp.toDate) {
            return format(timestamp.toDate(), 'PPpp'); // Format like: Jul 29, 2024, 1:30:00 PM
        }
        // Handle potential string or number timestamps (less ideal)
        if (typeof timestamp === 'string' || typeof timestamp === 'number') {
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
            // Ensure all required fields are present, provide defaults if necessary
            const data = doc.data();
            fetchedHistory.push({
                id: doc.id,
                userId: data.userId || '',
                language: data.language || 'unknown', // Default language if missing
                sourceCode: data.sourceCode || '',
                tokens: data.tokens || [],
                threeAddressCode: data.threeAddressCode || [],
                quadruples: data.quadruples || [],
                timestamp: data.timestamp || null, // Handle missing timestamp
            } as AnalysisHistoryItem);
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
      // Handle case where user is not logged in
      setIsLoading(false);
       setHistory([]); // Clear history if user logs out
    }
  }, [user]); // Re-fetch when user changes

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Analysis History</h1>

        {isLoading && (
          <div className="space-y-4">
             <Skeleton className="h-24 w-full rounded-lg" />
             <Skeleton className="h-24 w-full rounded-lg" />
             <Skeleton className="h-24 w-full rounded-lg" />
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
                       <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 w-full sm:w-auto text-left sm:text-right">
                            <span className="text-muted-foreground flex-shrink-0">{formatTimestamp(item.timestamp)}</span>
                            <span className="text-xs text-muted-foreground sm:text-sm">{item.tokens?.length || 0} tokens</span>
                       </div>
                   </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4 space-y-6">
                   {/* Source Code */}
                  <div>
                    <h4 className="text-md font-semibold mb-2">Source Code ({formatLanguage(item.language)})</h4>
                     <ScrollArea className="h-[200px] w-full rounded-md border bg-muted p-3">
                        <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                          {item.sourceCode || 'No source code recorded.'}
                        </pre>
                    </ScrollArea>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Tokens */}
                        <div className="lg:col-span-1">
                          <h4 className="text-md font-semibold mb-2">Tokens ({item.tokens?.length || 0})</h4>
                          {item.tokens && item.tokens.length > 0 ? (
                             <ScrollArea className="h-[400px] border rounded-md">
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {item.tokens.map((token, tIndex) => (
                                    <TableRow key={`token-${index}-${tIndex}`}>
                                        <TableCell className="font-medium">{token.type}</TableCell>
                                        <TableCell className="font-mono break-all">{token.value}</TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                                </Table>
                            </ScrollArea>
                          ) : <p className="text-sm text-muted-foreground p-4 border rounded-md">No tokens recorded.</p>}
                        </div>

                        {/* Intermediate Code */}
                        <div className="lg:col-span-2 space-y-4">
                            <div>
                                <h4 className="text-md font-semibold mb-2">Three-Address Code ({item.threeAddressCode?.length || 0})</h4>
                                {item.threeAddressCode && item.threeAddressCode.length > 0 ? (
                                 <ScrollArea className="h-[200px] border rounded-md">
                                    <Table>
                                        <TableHeader>
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
                                                <TableCell>{cIndex + 1}</TableCell>
                                                <TableCell className="font-mono">{code.op}</TableCell>
                                                <TableCell className="font-mono">{code.arg1 ?? '-'}</TableCell>
                                                <TableCell className="font-mono">{code.arg2 ?? '-'}</TableCell>
                                                <TableCell className="font-mono">{code.result}</TableCell>
                                            </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                 </ScrollArea>
                                ) : <p className="text-sm text-muted-foreground p-4 border rounded-md">No TAC recorded.</p>}
                           </div>
                            <div>
                                <h4 className="text-md font-semibold mb-2">Quadruples ({item.quadruples?.length || 0})</h4>
                                {item.quadruples && item.quadruples.length > 0 ? (
                                 <ScrollArea className="h-[200px] border rounded-md">
                                    <Table>
                                        <TableHeader>
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
                                            <TableCell>{qIndex}</TableCell>
                                            <TableCell className="font-mono">{quad.op}</TableCell>
                                            <TableCell className="font-mono">{quad.arg1 ?? '-'}</TableCell>
                                            <TableCell className="font-mono">{quad.arg2 ?? '-'}</TableCell>
                                            <TableCell className="font-mono">{quad.result}</TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                 </ScrollArea>
                                ) : <p className="text-sm text-muted-foreground p-4 border rounded-md">No Quadruples recorded.</p>}
                            </div>
                         </div>
                   </div>
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
