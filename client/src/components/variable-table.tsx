import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Eye, Trash2, Search, Database, Copy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface VariableDefinition {
  id: number;
  name: string;
  type: string;
  defaultValue: string | null;
  ownerId: string;
  ownerType: string;
  readPermission: string;
  writePermission: string;
  listPermission: string;
  createdAt: string;
  updatedAt: string;
}

interface VariableTableProps {
  variables: VariableDefinition[];
  onEdit: (variable: VariableDefinition) => void;
  onView: (variable: VariableDefinition) => void;
  onDelete: (variable: VariableDefinition) => void;
  userId?: string;
}

export function VariableTable({ variables, onEdit, onView, onDelete, userId = "user123" }: VariableTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredVariables = variables.filter(variable => {
    return variable.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const copyApiUrl = (variable: VariableDefinition) => {
    const baseUrl = window.location.origin;
    const apiUrl = `${baseUrl}/api/v1/variables/${variable.name}?userId=${userId}`;
    
    navigator.clipboard.writeText(apiUrl);
    toast({
      title: "API URL Copied",
      description: `URL for "${variable.name}" copied with userId: ${userId}`,
    });
  };



  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <CardTitle className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">Web Variables</CardTitle>
            <p className="text-slate-600 dark:text-slate-400 text-xs lg:text-sm mt-1">Manage your persistent variables and their permissions</p>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search variables..."
                className="pl-10 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile Card Layout */}
        <div className="md:hidden">
          {filteredVariables.map((variable) => (
            <div key={variable.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white text-sm">{variable.name}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Variable</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Value:</span>
                    <code className="text-xs font-mono text-slate-700 dark:text-slate-300 ml-2 block mt-1 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                      {variable.defaultValue || "null"}
                    </code>
                  </div>
                  

                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {formatDistanceToNow(new Date(variable.updatedAt), { addSuffix: true })}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyApiUrl(variable)}
                        className="text-slate-400 hover:text-blue-600 h-8 w-8 p-0"
                        title="Copy API URL"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(variable)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 h-8 w-8 p-0"
                        title="Edit Variable"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(variable)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 h-8 w-8 p-0"
                        title="View Variable"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(variable)}
                        className="text-slate-400 hover:text-red-600 h-8 w-8 p-0"
                        title="Delete Variable"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800">
                <TableHead className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Name</TableHead>
                <TableHead className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Value</TableHead>
                <TableHead className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Updated</TableHead>
                <TableHead className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVariables.map((variable) => (
                <TableRow key={variable.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <TableCell className="py-4 px-4 lg:px-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-3">
                        <Database className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white text-sm">{variable.name}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">Variable</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4 lg:px-6">
                    <code className="text-xs font-mono text-slate-700 dark:text-slate-300 max-w-24 truncate block">
                      {variable.defaultValue || "null"}
                    </code>
                  </TableCell>
                  <TableCell className="py-4 px-4 lg:px-6 text-xs text-slate-600 dark:text-slate-400">
                    {formatDistanceToNow(new Date(variable.updatedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="py-4 px-4 lg:px-6">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyApiUrl(variable)}
                        className="text-slate-400 hover:text-blue-600 h-8 w-8 p-0"
                        title="Copy API URL"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(variable)}
                        className="text-slate-400 hover:text-slate-600 h-8 w-8 p-0"
                        title="Edit Variable"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(variable)}
                        className="text-slate-400 hover:text-slate-600 h-8 w-8 p-0"
                        title="View Variable"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(variable)}
                        className="text-slate-400 hover:text-red-600 h-8 w-8 p-0"
                        title="Delete Variable"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredVariables.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No variables found matching your criteria
          </div>
        )}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {filteredVariables.length} of {variables.length} variables
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button size="sm">Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
