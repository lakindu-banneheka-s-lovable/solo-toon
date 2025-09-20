import { useState } from 'react';
import { Settings, Save, RotateCcw, Database, Smartphone, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { clearAllData, getStorageSize } from '@/lib/storage';

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings, isLoading } = useSettings();
  const { toast } = useToast();
  const [storageSize, setStorageSize] = useState<number>(0);

  const loadStorageSize = async () => {
    const size = await getStorageSize();
    setStorageSize(size);
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await clearAllData();
        toast({
          title: 'Data cleared',
          description: 'All local data has been cleared successfully'
        });
        window.location.reload();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to clear data',
          variant: 'destructive'
        });
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Customize your Solo-Toon reading experience
        </p>
      </div>

      {/* Reading Settings */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Reading Experience
          </CardTitle>
          <CardDescription>
            Configure how you read manga and webtoons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Saver */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="data-saver">Data Saver Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use compressed images to reduce data usage
              </p>
            </div>
            <Switch
              id="data-saver"
              checked={settings.dataSaver}
              onCheckedChange={(checked) => updateSetting('dataSaver', checked)}
            />
          </div>

          <Separator />

          {/* Reader Mode */}
          <div className="space-y-2">
            <Label>Default Reader Mode</Label>
            <Select 
              value={settings.readerMode} 
              onValueChange={(value: 'webtoon' | 'pages') => updateSetting('readerMode', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webtoon">Webtoon (Vertical scroll)</SelectItem>
                <SelectItem value="pages">Page by Page</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose your preferred reading layout
            </p>
          </div>

          <Separator />

          {/* Prefetch Count */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Prefetch Pages</Label>
              <Badge variant="outline">{settings.prefetchCount} pages</Badge>
            </div>
            <Slider
              value={[settings.prefetchCount]}
              onValueChange={([value]) => updateSetting('prefetchCount', value)}
              max={10}
              min={1}
              step={1}
              className="py-4"
            />
            <p className="text-sm text-muted-foreground">
              Number of pages to preload for faster reading
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Language & Content</CardTitle>
          <CardDescription>
            Set your preferred language for manga content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Preferred Language</Label>
            <Select 
              value={settings.preferredLanguage} 
              onValueChange={(value) => updateSetting('preferredLanguage', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data & Sync
          </CardTitle>
          <CardDescription>
            Manage your data and backup settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto Sync */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-sync">Auto Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup your data every 12 hours
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={settings.autoSync}
              onCheckedChange={(checked) => updateSetting('autoSync', checked)}
            />
          </div>

          <Separator />

          {/* Storage Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Local Storage Usage</Label>
              <Button variant="outline" size="sm" onClick={loadStorageSize}>
                Refresh
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Current usage: {formatBytes(storageSize)}</p>
              <p>This includes your library, reading progress, and cached data</p>
            </div>
          </div>

          <Separator />

          {/* Manual Sync */}
          <div className="space-y-2">
            <Label>Manual Backup</Label>
            <div className="flex gap-2">
              <Button variant="outline" disabled>
                <Database className="mr-2 h-4 w-4" />
                Sync Now
              </Button>
              <Button variant="outline" disabled>
                Import Data
              </Button>
              <Button variant="outline" disabled>
                Export Data
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Cloud sync will be available in a future update
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            App Preferences
          </CardTitle>
          <CardDescription>
            Customize the app appearance and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select 
              value={settings.theme} 
              onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that will affect your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={resetSettings}
              className="hover:bg-muted"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Settings
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearData}
            >
              Clear All Data
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Clearing all data will remove your library, reading progress, and settings. 
            This action cannot be undone.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}