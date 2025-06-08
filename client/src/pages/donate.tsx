import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Server, Zap, Users, Globe, Coffee } from "lucide-react";

export default function DonatePage() {
  const handleDonateClick = () => {
    window.open("https://www.paypal.com/donate/?business=7RD2D6N58A9KW&no_recurring=0&item_name=Trying+to+cast+utility+and+helpful+based+projects.+&currency_code=USD", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <Heart className="h-8 w-8 text-red-500" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Support WebVar
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Help keep this free cloud variable synchronization service running for the entire Resonite community
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Why Donate */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Server className="h-5 w-5 text-blue-500" />
                  Why Your Support Matters
                </CardTitle>
                <CardDescription>
                  Variable Sync is provided completely free to help the Resonite community build amazing experiences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Server Infrastructure</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Reliable cloud hosting, database management, and 24/7 uptime monitoring
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Globe className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Global Accessibility</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      CDN distribution and bandwidth costs to serve users worldwide
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Community Development</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Continuous feature development and community support
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Current Features</CardTitle>
                <CardDescription>
                  All available completely free to the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant="secondary" className="text-xs">Real-time Sync</Badge>
                  <Badge variant="secondary" className="text-xs">API Integration</Badge>
                  <Badge variant="secondary" className="text-xs">Resonite Types</Badge>
                  <Badge variant="secondary" className="text-xs">Enum Support</Badge>
                  <Badge variant="secondary" className="text-xs">WebSocket Events</Badge>
                  <Badge variant="secondary" className="text-xs">Permission Controls</Badge>
                  <Badge variant="secondary" className="text-xs">Dashboard UI</Badge>
                  <Badge variant="secondary" className="text-xs">API Documentation</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Donation */}
          <div className="space-y-6">
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Coffee className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-slate-900 dark:text-white">Make a Donation</CardTitle>
                <CardDescription>
                  Every contribution helps keep Variable Sync free and running smoothly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Your donation directly supports server costs, development time, and infrastructure improvements
                  </p>
                  
                  <Button 
                    onClick={handleDonateClick}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    <Heart className="h-4 w-4 mr-2" fill="currentColor" />
                    Donate via PayPal
                  </Button>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                    Secure donation through PayPal • No account required
                  </p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2 text-center">
                    Alternative Support
                  </h4>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p>• Share WebVar with other Resonite creators</p>
                    <p>• Provide feedback and feature suggestions</p>
                    <p>• Help improve documentation and guides</p>
                    <p>• Report bugs and contribute to development</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Thank You!
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    WebVar has been built with passion for the Resonite community. 
                    Your support helps ensure it remains available and continues to evolve 
                    based on community needs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-900 dark:text-white">Community Impact</CardTitle>
            <CardDescription>
              WebVar serving the Resonite community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Free</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Always</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">24/7</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">50+</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Data Types</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">∞</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Variables</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          <p>WebVar is an independent project created for the Resonite community</p>
          <p className="mt-1">Made with ❤️ for creators, builders, and innovators</p>
        </div>
      </div>
    </div>
  );
}