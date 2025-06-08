import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Eye, Trash2, Search, Database, Hash, ToggleLeft, Type, Copy } from "lucide-react";
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
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();

  const filteredVariables = variables.filter(variable => {
    const matchesSearch = variable.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || variable.type === typeFilter;
    return matchesSearch && matchesType;
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string':
        return <Type className="w-4 h-4 text-blue-600" />;
      case 'int':
      case 'float':
      case 'double':
        return <Hash className="w-4 h-4 text-green-600" />;
      case 'bool':
        return <ToggleLeft className="w-4 h-4 text-purple-600" />;
      default:
        return <Database className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'string':
        return "bg-blue-100 text-blue-800";
      case 'int':
      case 'float':
      case 'double':
        return "bg-green-100 text-green-800";
      case 'bool':
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getOwnerTypeBadgeColor = (ownerType: string) => {
    switch (ownerType) {
      case 'unsafe':
        return "bg-orange-100 text-orange-800";
      case 'user':
        return "bg-green-100 text-green-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatPermissions = (read: string, write: string) => {
    const permissions = [];
    if (read === 'anyone') permissions.push({ label: 'Read', color: 'bg-green-100 text-green-800' });
    if (write === 'anyone' || write === 'variable_owner') permissions.push({ label: 'Write', color: 'bg-amber-100 text-amber-800' });
    if (write === 'definition_owner') permissions.push({ label: 'Admin Only', color: 'bg-red-100 text-red-800' });
    if (write === 'variable_owner') permissions.push({ label: 'Variable Owner', color: 'bg-amber-100 text-amber-800' });
    
    return permissions;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">Web Variables</CardTitle>
            <p className="text-slate-600 text-sm mt-1">Manage your persistent variables and their permissions</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search variables..."
                className="pl-10 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="string">string</SelectItem>
                <SelectItem value="float">float</SelectItem>
                <SelectItem value="int">int</SelectItem>
                <SelectItem value="bool">bool</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile Card Layout */}
        <div className="md:hidden">
          {filteredVariables.map((variable) => (
            <div key={variable.id} className="border-b border-slate-200 last:border-b-0">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      {getTypeIcon(variable.type)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{variable.name}</div>
                      <div className="text-xs text-slate-600">{variable.ownerType}-owned</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge className={`text-xs font-medium ${getTypeBadgeColor(variable.type)}`}>
                      {variable.type}
                    </Badge>
                    <Badge className={`text-xs font-medium ${getOwnerTypeBadgeColor(variable.ownerType)}`}>
                      {variable.ownerType === 'unsafe' ? 'Unsafe' : 'Secure'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-slate-600">Value:</span>
                    <code className="text-xs font-mono text-slate-700 ml-2 block mt-1 bg-slate-50 p-2 rounded">
                      {variable.defaultValue || "null"}
                    </code>
                  </div>
                  
                  <div>
                    <span className="text-xs font-medium text-slate-600">Permissions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formatPermissions(variable.readPermission, variable.writePermission).map((perm, index) => (
                        <Badge key={index} className={`text-xs font-medium ${perm.color}`}>
                          {perm.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
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
                        className="text-slate-400 hover:text-slate-600 h-8 w-8 p-0"
                        title="Edit Variable"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(variable)}
                        className="text-slate-400 hover:text-slate-600 h-8 w-8 p-0"
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
              <TableRow className="bg-slate-50">
                <TableHead className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-slate-600">Name</TableHead>
                <TableHead className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-slate-600">Type</TableHead>
                <TableHead className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-slate-600">Value</TableHead>
                <TableHead className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-slate-600">Permissions</TableHead>
                <TableHead className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-slate-600">Updated</TableHead>
                <TableHead className="text-left py-3 px-4 lg:px-6 text-sm font-medium text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVariables.map((variable) => (
                <TableRow key={variable.id} className="hover:bg-slate-50">
                  <TableCell className="py-4 px-4 lg:px-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        {getTypeIcon(variable.type)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{variable.name}</div>
                        <div className="text-xs text-slate-600">{variable.ownerType}-owned</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4 lg:px-6">
                    <Badge className={`text-xs font-medium ${getTypeBadgeColor(variable.type)}`}>
                      {variable.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-4 lg:px-6">
                    <code className="text-xs font-mono text-slate-700 max-w-24 truncate block">
                      {variable.defaultValue || "null"}
                    </code>
                  </TableCell>
                  <TableCell className="py-4 px-4 lg:px-6">
                    <div className="flex flex-wrap gap-1">
                      {formatPermissions(variable.readPermission, variable.writePermission).map((perm, index) => (
                        <Badge key={index} className={`text-xs font-medium ${perm.color}`}>
                          {perm.label}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4 lg:px-6 text-xs text-slate-600">
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
