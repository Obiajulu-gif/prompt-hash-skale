"use client";

import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatePromptForm } from "./CreatePromptForm";
import { PromptListings } from "./PromptListings";

export default function SellPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-foreground">
      <Navigation />
      <main className="flex-1 container py-10">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="new">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New Prompt</TabsTrigger>
              <TabsTrigger value="listings">My Prompts</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-8">
              <Card className="border-gray-800 bg-gray-950">
                <CardHeader>
                  <CardTitle>Create a New Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <CreatePromptForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="listings" className="mt-8">
              <PromptListings />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
