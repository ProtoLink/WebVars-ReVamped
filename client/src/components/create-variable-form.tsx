import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(1, "Variable name is required").regex(/^[a-zA-Z0-9._-]+$/, "Invalid variable name format"),
  defaultValue: z.string().optional(),
  scope: z.enum(["private", "global"]),
  type: z.string().min(1, "Variable type is required"),
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
      scope: "private",
      type: "string",
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    try {
      // Set permissions based on scope to match demo data patterns
      const isGlobal = data.scope === "global";
      const formData = {
        ...data,
        ownerType: "user",
        readPermission: isGlobal ? "anyone" : "variable_owner",
        writePermission: isGlobal ? "variable_owner" : "variable_owner",
        listPermission: isGlobal ? "anyone" : "definition_owner",
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variable Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select variable type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Variable Scope</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="text-sm font-normal">
                      Private - Only you can access this variable
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="global" id="global" />
                    <Label htmlFor="global" className="text-sm font-normal">
                      Global - Anyone can read and write this variable
                    </Label>
                  </div>
                </RadioGroup>
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