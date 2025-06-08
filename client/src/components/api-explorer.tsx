import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

interface ApiExplorerProps {
  onSendRequest: (request: {
    method: string;
    endpoint: string;
    headers: Record<string, string>;
    body?: string;
  }) => Promise<{
    status: number;
    statusText: string;
    data: any;
    responseTime: number;
  }>;
}

export function ApiExplorer({ onSendRequest }: ApiExplorerProps) {
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("/api/v1/variables/{name}");
  const [headers, setHeaders] = useState([
    { key: "Authorization", value: "Bearer your-api-key" },
    { key: "Content-Type", value: "application/json" },
  ]);
  const [requestBody, setRequestBody] = useState('{\n  "value": "Hello World",\n  "type": "string"\n}');
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRequest = async () => {
    setIsLoading(true);
    try {
      const headerObj = headers.reduce((acc, header) => {
        if (header.key && header.value) {
          acc[header.key] = header.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const result = await onSendRequest({
        method,
        endpoint,
        headers: headerObj,
        body: method !== "GET" ? requestBody : undefined,
      });

      setResponse(result);
    } catch (error) {
      setResponse({
        status: 0,
        statusText: "Error",
        data: { error: error instanceof Error ? error.message : "Unknown error" },
        responseTime: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateHeader = (index: number, key: string, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = { key, value };
    setHeaders(newHeaders);
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800";
      case "POST":
        return "bg-blue-100 text-blue-800";
      case "PUT":
        return "bg-amber-100 text-amber-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-400";
    if (status >= 400 && status < 500) return "text-amber-400";
    if (status >= 500) return "text-red-400";
    return "text-slate-400";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">API Explorer</CardTitle>
        <p className="text-slate-600 dark:text-slate-400 text-xs lg:text-sm mt-1">Test API endpoints directly from the dashboard</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Request Builder */}
          <div>
            <h3 className="text-base lg:text-lg font-semibold text-slate-900 dark:text-white mb-3 lg:mb-4">Request Builder</h3>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-full sm:w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/api/v1/variables/{name}"
                  className="flex-1"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Headers</Label>
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Input
                        value={header.key}
                        onChange={(e) => updateHeader(index, e.target.value, header.value)}
                        placeholder="Header name"
                        className="flex-1"
                      />
                      <Input
                        value={header.value}
                        onChange={(e) => updateHeader(index, header.key, e.target.value)}
                        placeholder="Header value"
                        className="flex-1"
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addHeader} className="w-full sm:w-auto">
                    Add Header
                  </Button>
                </div>
              </div>

              {method !== "GET" && (
                <div>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">Request Body</Label>
                  <Textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder='{\n  "value": "Hello World",\n  "type": "string"\n}'
                    className="font-mono text-sm"
                    rows={8}
                  />
                </div>
              )}

              <Button 
                onClick={handleSendRequest} 
                disabled={isLoading}
                className="w-full bg-resonite-600 text-white hover:bg-resonite-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isLoading ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </div>

          {/* Response Viewer */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Response</h3>
            <div className="bg-slate-900 rounded-lg p-4 text-sm font-mono text-green-400 min-h-96">
              {response ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400">
                      Status: <span className={getStatusColor(response.status)}>
                        {response.status} {response.statusText}
                      </span>
                    </span>
                    <span className="text-slate-400">Time: {response.responseTime}ms</span>
                  </div>
                  <pre className="text-green-400 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  Send a request to see the response here
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
