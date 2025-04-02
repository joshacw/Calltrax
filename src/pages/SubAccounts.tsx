
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getAgencyById, getAgencyLocations, saveSubAccount, getSubAccounts, removeSubAccount, subAccounts as allSubAccounts } from "@/services/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Users, UserPlus, Trash2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  locationId: z.string().min(1, "Please select a location"),
  active: z.boolean().default(true),
});

const SubAccountsPage = () => {
  const { user } = useAuth();
  const [subAccounts, setSubAccounts] = useState<typeof allSubAccounts>([]);
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      locationId: "",
      active: true,
    },
  });
  
  useEffect(() => {
    if (user?.agencyId) {
      loadSubAccounts();
      loadLocations();
    }
  }, [user]);
  
  const loadSubAccounts = () => {
    if (!user?.agencyId) return;
    const accounts = getSubAccounts(user.agencyId);
    setSubAccounts(accounts);
  };
  
  const loadLocations = () => {
    if (!user?.agencyId) return;
    const agency = getAgencyById(user.agencyId);
    if (agency) {
      const locationList = getAgencyLocations(agency.locations);
      setLocations(locationList);
    }
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.agencyId) return;
    
    try {
      // Create new subaccount with agencyId
      const newSubAccount = saveSubAccount(user.agencyId, {
        name: values.name,
        email: values.email,
        password: values.password,
        locationId: values.locationId,
        active: values.active,
        agencyId: user.agencyId, // Add the agencyId here
      });
      
      setSubAccounts([...subAccounts, newSubAccount]);
      setIsOpen(false);
      form.reset();
      toast.success(`${values.name} subaccount created successfully`);
    } catch (error) {
      console.error("Error creating subaccount:", error);
      toast.error("Failed to create subaccount");
    }
  };
  
  const handleRemoveSubAccount = (id: string, name: string) => {
    if (!user?.agencyId) return;
    
    try {
      removeSubAccount(user.agencyId, id);
      setSubAccounts(subAccounts.filter(account => account.id !== id));
      toast.success(`${name} subaccount removed successfully`);
    } catch (error) {
      console.error("Error removing subaccount:", error);
      toast.error("Failed to remove subaccount");
    }
  };
  
  const toggleSubAccountStatus = (id: string, currentStatus: boolean, name: string) => {
    if (!user?.agencyId) return;
    
    try {
      const updatedAccounts = subAccounts.map(account => {
        if (account.id === id) {
          const updatedAccount = { ...account, active: !currentStatus };
          
          // In a real app, you would call an API to update the status
          return updatedAccount;
        }
        return account;
      });
      
      setSubAccounts(updatedAccounts);
      toast.success(`${name} is now ${!currentStatus ? 'active' : 'inactive'}`);
    } catch (error) {
      console.error("Error toggling subaccount status:", error);
      toast.error("Failed to update subaccount status");
    }
  };
  
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Subaccounts</h1>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus size={16} />
                <span>Add Subaccount</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Add New Subaccount</SheetTitle>
                <SheetDescription>
                  Create a new subaccount for a specific location
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email" {...field} />
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
                            <Input type="password" placeholder="Enter password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 6 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="locationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a location" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {locations.map(location => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Active Status</FormLabel>
                            <FormDescription>
                              Activate or deactivate this subaccount
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end pt-4 space-x-2">
                      <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Subaccount</Button>
                    </div>
                  </form>
                </Form>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Manage Subaccounts</CardTitle>
            <CardDescription>
              Subaccounts provide access to specific location data within your agency
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p>No subaccounts created yet. Add your first subaccount using the button above.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subAccounts.map((account) => {
                    const locationName = locations.find(l => l.id === account.locationId)?.name || "Unknown";
                    
                    return (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>{account.email}</TableCell>
                        <TableCell>{locationName}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={account.active}
                              onCheckedChange={() => toggleSubAccountStatus(account.id, account.active, account.name)}
                            />
                            <span className={account.active ? "text-green-600" : "text-gray-500"}>
                              {account.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove subaccount</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {account.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveSubAccount(account.id, account.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SubAccountsPage;
