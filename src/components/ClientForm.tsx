import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const clientSchema = z.object({
  name: z.string().min(2, {
    message: "Client name must be at least 2 characters.",
  }),
  timezone: z.string().min(1, {
    message: "Please select a timezone.",
  }),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  onSuccess?: (clientName: string, clientId: string, webhookUrl: string) => void;
}

const generateWebhookUrl = () => {
  const webhookId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
  return `${window.location.origin}/api/webhooks/lead/${webhookId}`;
};

export const ClientForm = ({ onSuccess }: ClientFormProps) => {
  const [isProvisioning, setIsProvisioning] = useState(false);
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      timezone: "Australia/Perth",
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    setIsProvisioning(true);
    
    try {
      console.log('Starting provisioning for:', data.name);

      // Call the edge function to provision client
      const { data: provisionData, error: provisionError } = await supabase.functions.invoke('provision-client', {
        body: {
          clientName: data.name.trim(),
          timezone: data.timezone,
        }
      });

      console.log('Edge function response:', provisionData);

      if (provisionError) {
        throw new Error(provisionError.message || 'Edge function invocation failed');
      }

      if (!provisionData.success) {
        throw new Error(provisionData.error || 'Provisioning failed');
      }

      // Create webhook for the client
      const webhookUrl = generateWebhookUrl();
      const webhookId = webhookUrl.split('/').pop();
      
      const { error: webhookError } = await supabase
        .from('webhooks')
        .insert({
          client_id: provisionData.tenant.id,
          type: 'lead',
          url: webhookUrl,
          secret: webhookId || '',
          active: true,
        });
        
      if (webhookError) {
        console.error('Webhook creation error:', webhookError);
        // Don't fail the whole process if webhook creation fails
        toast.error('Client created but webhook setup failed. Please create webhook manually.');
      }

      // Success!
      toast.success(`Client "${data.name}" provisioned successfully! Dialpad CC ID: ${provisionData.dialpad.id}`);
      
      console.log('Provisioning result:', {
        tenant: provisionData.tenant,
        dialpad: provisionData.dialpad,
      });

      // Reset form
      form.reset();
      
      // Call success callback
      if (onSuccess) {
        onSuccess(data.name, provisionData.tenant.id, webhookUrl);
      }

    } catch (error: any) {
      console.error('Provisioning error:', error);
      
      toast.error(`Provisioning failed: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Information</CardTitle>
        <CardDescription>
          Create a new client and automatically set up their Dialpad contact center.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Acme Corporation" 
                      {...field} 
                      disabled={isProvisioning} 
                    />
                  </FormControl>
                  <FormDescription>
                    This will be used as the contact center name in Dialpad
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isProvisioning}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Australia/Perth">Perth (AWST)</SelectItem>
                      <SelectItem value="Australia/Melbourne">Melbourne (AEST/AEDT)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (AEST/AEDT)</SelectItem>
                      <SelectItem value="Australia/Brisbane">Brisbane (AEST)</SelectItem>
                      <SelectItem value="Australia/Adelaide">Adelaide (ACST/ACDT)</SelectItem>
                      <SelectItem value="Australia/Darwin">Darwin (ACST)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Contact center operating timezone
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h3 className="font-semibold text-sm">What happens when you provision?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Creates Dialpad contact center</li>
                <li>✓ Sets up default operating hours (Mon-Fri, 9am-5pm)</li>
                <li>✓ Stores tenant record in database</li>
                <li>✓ Creates inbound lead webhook</li>
              </ul>
            </div>
            
            <Button type="submit" disabled={isProvisioning} className="w-full">
              {isProvisioning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Provisioning...
                </>
              ) : (
                "Provision Client"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
