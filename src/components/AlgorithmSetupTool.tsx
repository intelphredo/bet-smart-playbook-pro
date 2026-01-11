
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AlgorithmSetupTool = () => {
  const [name, setName] = useState("Statistical Edge");
  const [description, setDescription] = useState("Pure statistics-based algorithm that considers situational spots, weather impacts, injuries, and matchup advantages to find edges in the betting markets.");
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
      
      const algorithmId = `algo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const { data, error } = await supabase
        .from("algorithms")
        .insert({
          id: algorithmId,
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
      
      // Check if Statistical Edge algorithm exists
      const { data, error } = await supabase
        .from("algorithms")
        .select("*")
        .eq("id", "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1");
      
      if (error) throw error;
      
      if (data && data.length === 0) {
        // Create the Statistical Edge algorithm
        const { error: insertError } = await supabase
          .from("algorithms")
          .insert({
            id: "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1",
            name: "Statistical Edge",
            description: "Pure statistics-based algorithm that considers situational spots, weather impacts, injuries, and matchup advantages to find edges in the betting markets."
          });
        
        if (insertError) throw insertError;
        
        toast.success("Statistical Edge algorithm created successfully!");
        queryClient.invalidateQueries({ queryKey: ["algorithms"] });
      } else {
        toast.info("Statistical Edge algorithm already exists");
      }
    } catch (error) {
      console.error("Error creating Statistical Edge algorithm:", error);
      toast.error(`Failed to create algorithm: ${error.message}`);
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
            Create Statistical Edge Algorithm
          </Button>
          <p className="text-sm text-muted-foreground mt-1">
            Creates the Statistical Edge algorithm with ID "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1"
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
