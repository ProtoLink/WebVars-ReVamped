import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(1, "Variable name is required").regex(/^[a-zA-Z0-9._-]+$/, "Invalid variable name format"),
  defaultValue: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateVariableFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function CreateVariableForm({ onSubmit, isLoading }: CreateVariableFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      defaultValue: "",
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    try {
      // Add default values for required backend fields
      const formData = {
        ...data,
        type: "string",
        ownerType: "user",
        readPermission: "variable_owner",
        writePermission: "variable_owner",
        listPermission: "definition_owner",
      };
      await onSubmit(formData);
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variable Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., MyApp.userScore" 
                  {...field} 
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Value (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Hello World" 
                  {...field} 
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Creating..." : "Create Variable"}
        </Button>
      </form>
    </Form>
  );
}