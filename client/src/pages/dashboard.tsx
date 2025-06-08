import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Eye, FileText, BarChart3, Cloud, Database, User, BarChart, Heart } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { CardDescription } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import { StatsCards } from "@/components/stats-cards";
import { VariableTable } from "@/components/variable-table";
import { CreateVariableForm } from "@/components/create-variable-form";
import { ApiExplorer } from "@/components/api-explorer";
import { VariableEditor } from "@/components/variable-editor";

// Navigation items
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, active: true },
  { id: "variables", label: "Variables", icon: Cloud },
  { id: "api-explorer", label: "API Explorer", icon: Settings },
  { id: "documentation", label: "Documentation", icon: FileText },
];

interface DashboardProps {
  userId: string;
}

export default function Dashboard({ userId }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedVariable, setSelectedVariable] = useState<any>(null);
  const [editorMode, setEditorMode] = useState<'edit' | 'view'>('view');
  const [showEditor, setShowEditor] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [variableToDelete, setVariableToDelete] = useState<any>(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket(userId);

  // Fetch variable definitions (all globally accessible variables)
  const { data: variablesData, isLoading: variablesLoading } = useQuery({
    queryKey: ["/api/v1/definitions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/v1/definitions`);
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ["/api/v1/stats", { userId }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/v1/stats?userId=${userId}`);
      return response.json();
    },
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.event) {
        case "definition_created":
        case "definition_updated":
        case "definition_deleted":
          queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/v1/stats", { userId }] });
          break;
        case "variable_updated":
          // Force immediate refresh of variable values for real-time updates
          queryClient.invalidateQueries({ queryKey: ["/api/v1/variable-values"] });
          queryClient.invalidateQueries({ queryKey: ["/api/v1/stats", { userId }] });
          
          // Use a small delay to ensure the API has processed the update
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ["/api/v1/variable-values"] });
          }, 50);
          
          toast({
            title: "Variable Updated",
            description: `Variable ${lastMessage.data.name} was updated`,
          });
          break;
      }
    }
  }, [lastMessage, queryClient, toast, userId]);

  // Create variable mutation
  const createVariableMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/v1/definitions/${data.name}?userId=${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/stats", { userId }] });
      toast({
        title: "Variable Created",
        description: "Variable definition created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create variable",
        variant: "destructive",
      });
    },
  });



  // Delete variable mutation
  const deleteVariableMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("DELETE", `/api/v1/definitions/${name}?userId=${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/stats", { userId }] });
      setShowDeleteDialog(false);
      setVariableToDelete(null);
      toast({
        title: "Variable Deleted",
        description: "Variable definition deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete variable",
        variant: "destructive",
      });
    },
  });

  // API Explorer send request function
  const handleApiRequest = async (request: {
    method: string;
    endpoint: string;
    headers: Record<string, string>;
    body?: string;
  }) => {
    setApiTestLoading(true);
    const startTime = performance.now();
    
    try {
      const url = `${request.endpoint}${request.endpoint.includes('?') ? '&' : '?'}userId=${userId}`;
      const response = await fetch(url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        body: request.body ? request.body : undefined,
      });

      const responseTime = Math.round(performance.now() - startTime);
      let data;
      
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      const result = {
        status: response.status,
        statusText: response.statusText,
        data,
        responseTime,
      };
      
      // WebSocket will handle real-time updates automatically
      
      setApiTestResult(result);
      return result;
    } catch (error: any) {
      const responseTime = Math.round(performance.now() - startTime);
      const result = {
        status: 0,
        statusText: 'Network Error',
        data: { error: error.message },
        responseTime,
      };
      
      setApiTestResult(result);
      return result;
    } finally {
      setApiTestLoading(false);
    }
  };

  const handleEdit = (variable: any) => {
    setSelectedVariable(variable);
    setEditorMode('edit');
    setShowEditor(true);
  };

  const handleView = (variable: any) => {
    setSelectedVariable(variable);
    setEditorMode('view');
    setShowEditor(true);
  };

  const handleDelete = (variable: any) => {
    setVariableToDelete(variable);
    setShowDeleteDialog(true);
  };

  const variables = variablesData?.data || [];
  const stats = statsData?.data || {
    totalVariables: 0,
    totalValues: 0,
    apiRequestsToday: 0,
    activeUsers: 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile Header */}
      <div className="border-b bg-white dark:bg-slate-800 px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cloud className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
              <h1 className="text-lg lg:text-2xl font-bold text-slate-900 dark:text-white">Variable Sync</h1>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              <div className={`mr-1 h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Logged in as: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">{userId}</span>
              </span>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => window.open("/donate", "_blank")}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                <Heart className="h-4 w-4 mr-2" fill="currentColor" />
                Support
              </Button>
              <Button 
                onClick={() => {
                  apiRequest("POST", "/api/auth/logout").then(() => {
                    window.location.reload();
                  });
                }}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <User className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden bg-white dark:bg-slate-800 border-b overflow-x-auto">
        <nav className="flex space-x-1 px-4 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === item.id
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-64 bg-white dark:bg-slate-800 border-r h-[calc(100vh-73px)] p-6">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === item.id
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-4 lg:space-y-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 mt-1">
                  Monitor your Web Variables and API activity for user: 
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs lg:text-sm ml-1">{userId}</span>
                </p>
              </div>

              <StatsCards stats={stats} />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <BarChart className="h-5 w-5" />
                    <span>System Status</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Real-time connection and API health monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-medium text-sm">WebSocket</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {isConnected ? 'Connected' : 'Disconnected'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <Database className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Database</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {variables.length} definitions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg sm:col-span-2 lg:col-span-1">
                      <User className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium text-sm">Current User</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                          {userId}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "variables" && (
            <div className="space-y-4 lg:space-y-6">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Variables</h1>
                  <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 mt-1">
                    Manage your Web Variable definitions for user: 
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs lg:text-sm ml-1">{userId}</span>
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      New Variable
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="mx-4 sm:mx-0 sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create Variable Definition</DialogTitle>
                      <DialogDescription>
                        Define a new Web Variable with its data type and permissions.
                      </DialogDescription>
                    </DialogHeader>
                    <CreateVariableForm
                      onSubmit={async (data) => {
                        return new Promise<void>((resolve, reject) => {
                          createVariableMutation.mutate(data, {
                            onSuccess: () => resolve(),
                            onError: (error) => reject(error)
                          });
                        });
                      }}
                      isLoading={createVariableMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {variablesLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <VariableTable
                  variables={variables}
                  onEdit={handleEdit}
                  onView={handleView}
                  onDelete={handleDelete}
                  userId={userId}
                />
              )}
            </div>
          )}

          {activeTab === "api-explorer" && (
            <div className="space-y-4 lg:space-y-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">API Explorer</h1>
                <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 mt-1">
                  Test API endpoints and explore variable operations for user: 
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs lg:text-sm ml-1">{userId}</span>
                </p>
              </div>
              
              <ApiExplorer onSendRequest={handleApiRequest} />
            </div>
          )}

          {activeTab === "documentation" && (
            <div className="space-y-4 lg:space-y-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Documentation</h1>
                <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 mt-1">
                  Learn how to integrate with the Variable Sync API
                </p>
              </div>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Getting Started</CardTitle>
                  <CardDescription className="text-sm">
                    Quick guide to using the Variable Sync API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-sm lg:text-base">API Base URL</h3>
                    <code className="bg-slate-100 dark:bg-slate-800 p-2 rounded block text-xs lg:text-sm overflow-x-auto">
                      {window.location.origin}/api/v1
                    </code>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2 text-sm lg:text-base">Authentication</h3>
                    <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mb-2">
                      All API requests require a userId parameter:
                    </p>
                    <code className="bg-slate-100 dark:bg-slate-800 p-2 rounded block text-xs lg:text-sm overflow-x-auto">
                      {`GET /api/v1/variables/player_score?userId=${userId}`}
                    </code>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2 text-sm lg:text-base">Example: Get Variable Value</h3>
                    <code className="bg-slate-100 dark:bg-slate-800 p-2 rounded block text-xs lg:text-sm overflow-x-auto">
                      {`curl -X GET "${window.location.origin}/api/v1/variables/player_score?userId=${userId}"`}
                    </code>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2 text-sm lg:text-base">Example: Set Variable Value</h3>
                    <code className="bg-slate-100 dark:bg-slate-800 p-2 rounded block text-xs overflow-x-auto">
                      <div>{`curl -X POST "${window.location.origin}/api/v1/variables/player_score?userId=${userId}" \\`}</div>
                      <div className="mt-1">&nbsp;&nbsp;-H "Content-Type: application/json" \</div>
                      <div className="mt-1">&nbsp;&nbsp;-d '{"{"}"value": "1500"{"}"}'</div>
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Variable Editor Dialog */}
      <VariableEditor
        variable={selectedVariable}
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setSelectedVariable(null);
        }}
        mode={editorMode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Variable</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{variableToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setVariableToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteVariableMutation.mutate(variableToDelete?.name)}
              disabled={deleteVariableMutation.isPending}
            >
              {deleteVariableMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}