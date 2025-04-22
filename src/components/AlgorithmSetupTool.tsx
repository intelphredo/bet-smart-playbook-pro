
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AlgorithmSetupTool = () => {
  const [name, setName] = useState("Sports Edge ML");
  const [description, setDescription] = useState("Machine learning algorithm that analyzes historical data, player stats, and team performance to predict match outcomes.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();
  
  const { data: algorithms, isLoading } = useQuery({
    queryKey: ["algorithms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("algorithms")
        .select("*");
        
      if (error) throw error;
      return data;
    }
  });
  
  const handleCreateAlgorithm = async () => {
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from("algorithms")
        .insert({
          name,
          description
        })
        .select();
      
      if (error) throw error;
      
      toast.success(`Algorithm "${name}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["algorithms"] });
      
      // Reset form
      setName("");
      setDescription("");
    } catch (error) {
      console.error("Error creating algorithm:", error);
      toast.error(`Failed to create algorithm: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUseDefault = async () => {
    try {
      setIsSubmitting(true);
      
      // Check if default algorithm exists
      const { data, error } = await supabase
        .from("algorithms")
        .select("*")
        .eq("name", "Sports Edge ML");
      
      if (error) throw error;
      
      if (data && data.length === 0) {
        // Create the default algorithm
        const { error: insertError } = await supabase
          .from("algorithms")
          .insert({
            id: "default-algorithm",
            name: "Sports Edge ML",
            description: "Machine learning algorithm that analyzes historical data, player stats, and team performance to predict match outcomes."
          });
        
        if (insertError) throw insertError;
        
        toast.success("Default algorithm created successfully!");
        queryClient.invalidateQueries({ queryKey: ["algorithms"] });
      } else {
        toast.info("Default algorithm already exists");
      }
    } catch (error) {
      console.error("Error creating default algorithm:", error);
      toast.error(`Failed to create default algorithm: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Algorithm Setup Tool</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button 
            onClick={handleUseDefault} 
            disabled={isSubmitting}
            variant="outline"
          >
            Create Default Algorithm
          </Button>
          <p className="text-sm text-muted-foreground mt-1">
            Creates an algorithm with ID "default-algorithm" to use with the existing code
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="algo-name" className="text-sm mb-1 block">Algorithm Name</label>
            <Input
              id="algo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Advanced ML Predictor"
            />
          </div>
          
          <div>
            <label htmlFor="algo-desc" className="text-sm mb-1 block">Description</label>
            <Textarea
              id="algo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how the algorithm works..."
              rows={3}
            />
          </div>
          
          <Button 
            onClick={handleCreateAlgorithm} 
            disabled={isSubmitting || !name || !description}
          >
            Create New Algorithm
          </Button>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Available Algorithms</h3>
          {isLoading ? (
            <div>Loading...</div>
          ) : !algorithms || algorithms.length === 0 ? (
            <div className="text-amber-600 dark:text-amber-400">
              No algorithms found. Please create one using the form above.
            </div>
          ) : (
            <div className="space-y-3">
              {algorithms.map((algo) => (
                <div key={algo.id} className="border p-3 rounded-md">
                  <div className="font-semibold">{algo.name}</div>
                  <div className="text-sm text-muted-foreground">{algo.description}</div>
                  <div className="text-xs mt-1">ID: {algo.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlgorithmSetupTool;
