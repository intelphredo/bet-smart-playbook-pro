
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Search, LogIn, UserPlus } from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const NavBar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Check if user is already logged in
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = (values: LoginFormValues) => {
    // In a real app, you would validate credentials with a backend
    // For now, we'll simulate a successful login
    setIsLoggedIn(true);
    
    // Extract username from email (before the @)
    const extractedUsername = values.email.split('@')[0];
    setUsername(extractedUsername);
    
    // Store in localStorage for persistence
    localStorage.setItem('username', extractedUsername);
    
    // Close the modal
    setShowLoginModal(false);
    
    // Show success toast
    toast({
      title: "Login Successful",
      description: `Welcome back, ${extractedUsername}!`,
    });
  };

  const handleSignup = (values: LoginFormValues) => {
    // In a real app, you would create a new account in a backend
    setIsLoggedIn(true);
    
    // Extract username from email
    const extractedUsername = values.email.split('@')[0];
    setUsername(extractedUsername);
    
    // Store in localStorage for persistence
    localStorage.setItem('username', extractedUsername);
    
    // Close the modal
    setShowSignupModal(false);
    
    // Show success toast
    toast({
      title: "Account Created",
      description: "Your account has been created successfully!",
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername(null);
    localStorage.removeItem('username');
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  return (
    <div className="border-b flex items-center justify-between px-4 h-16">
      <div className="flex items-center space-x-2">
        <div className="font-bold text-2xl text-navy-500 flex items-center">
          <span className="mr-1 text-gold-500">Bet</span>Smart
        </div>
        <span className="text-xs bg-navy-500 text-white px-2 py-1 rounded-md hidden md:block">
          PLAYBOOK PRO
        </span>
      </div>
      
      <div className="flex items-center space-x-4 ml-auto">
        <div className="relative hidden md:block">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search teams, games..." 
            className="w-64 pl-8 rounded-md border h-9 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
          />
        </div>
        
        <ModeToggle />
        
        {isLoggedIn ? (
          <div className="flex items-center space-x-4">
            <span className="hidden md:block text-sm font-medium">Hello, {username}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>Log Out</Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Log In</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => setShowSignupModal(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Up</span>
            </Button>
          </div>
        )}
      </div>

      {/* Login Dialog */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login to BetSmart</DialogTitle>
            <DialogDescription>
              Enter your credentials below to access your account.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" className="w-full">Log In</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Signup Dialog */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create your BetSmart account</DialogTitle>
            <DialogDescription>
              Join BetSmart today to get personalized betting recommendations.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" className="w-full">Create Account</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NavBar;
