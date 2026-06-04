import { useState, useRef, useCallback } from 'react';
import { Globe, Upload, X, Image, Eye, ChevronDown, RectangleHorizontal, Square, RectangleVertical, Gem } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';


export const BANNER_TYPES = [
  { type: 'rectangle' as const, label: 'Rectangle', dimensions: '300×250', icon: RectangleHorizontal },
  { type: 'square' as const, label: 'Square', dimensions: '300×300', icon: Square },
  { type: 'vertical' as const, label: 'Vertical', dimensions: '160×600', icon: RectangleVertical },
] as const;

type BannerType = typeof BANNER_TYPES[number]['type'];

export interface BannerSlot {
  type: BannerType;
  fileName: string | null;
  preview: string | null;
  file: File | null;
}

export interface AudienceExtensionData {
  enabled: boolean;
  banners: BannerSlot[];
  impressionPixel: string;
}

interface Props {
  data: AudienceExtensionData;
  onChange: (data: AudienceExtensionData) => void;
  dailyBudget: number;
  disabled: boolean;
}

export default function AudienceExtensionStep({ data, onChange, dailyBudget, disabled }: Props) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<BannerType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const budgetIncrease = data.enabled ? Math.round(dailyBudget * 0.2) : 0;

  const selectedTypeInfo = BANNER_TYPES.find(b => b.type === selectedType);

  const uploadedTypes = data.banners.filter(b => b.fileName).map(b => b.type);

  const availableTypes = BANNER_TYPES.filter(b => !uploadedTypes.includes(b.type));

  const handleSelectType = (type: BannerType) => {
    setSelectedType(type);
    setUploadDialogOpen(true);
  };

  async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      // 1. Read the file as a Data URL
      reader.readAsDataURL(file);

      reader.onload = (e) => {
        const img = new window.Image();
        
        // 2. Set the image source to the result of the reader
        img.src = e.target.result.toString();

        img.onload = () => {
          // 3. Access the naturalWidth and naturalHeight
          const dimensions = {
            width: img.naturalWidth,
            height: img.naturalHeight
          };
          resolve(dimensions);
        };

        img.onerror = (err) => reject("Error loading image: " + err);
      };

      reader.onerror = (err) => reject("Error reading file: " + err);
    });
  }

  const processFile = useCallback( async (file: File) => {
    if (!selectedType) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload an image file (JPEG, JPG, PNG, GIF).",
        variant: "destructive",
      });
      return;
      }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    };

    console.log("Processing file:", file);
    const dimensions = await getImageDimensions(file);

    const acceptedDimensions = {
      rectangle: { width: 300, height: 250 },
      square: { width: 300, height: 300 },
      vertical: { width: 160, height: 600 },
    };

    const required = acceptedDimensions[selectedType];
    if (dimensions.width != required.width || dimensions.height != required.height) {
      toast({
        title: "Image dimensions incorrect",
        description: `Your image is ${dimensions.width}×${dimensions.height}px. Please upload an image that is exactly ${required.width}×${required.height}px.`,
        variant: "destructive",
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    const existingIndex = data.banners.findIndex(b => b.type === selectedType);

    if (existingIndex >= 0) {
      const next = [...data.banners];
      next[existingIndex] = { type: selectedType, fileName: file.name, preview, file };
      onChange({ ...data, banners: next });
    } else {
      onChange({ ...data, banners: [...data.banners, { type: selectedType, fileName: file.name, preview, file }] });
    }

    setUploadDialogOpen(false);
    setSelectedType(null);
  }, [selectedType, data, onChange]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const removeBanner = (type: BannerType) => {
    onChange({ ...data, banners: data.banners.filter(b => b.type !== type) });
  };

  const uploadedBanners = data.banners.filter(b => b.fileName);

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <Label className="text-base font-semibold">Re-target across web</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Extend reach with display banners on premium web inventory
          </p>
        </div>
        <Switch
          checked={data.enabled}
          onCheckedChange={(checked) => onChange({ ...data, enabled: checked })}
        />
      </div>

      {data.enabled && (
        <>
          {/* Budget impact */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              Budget increase: <span className="font-semibold text-foreground">+20%</span>
              {dailyBudget > 0 && (
                <span className="text-muted-foreground"> (+${budgetIncrease}/day → ${dailyBudget + budgetIncrease}/day total)</span>
              )}
            </p>
          </div>

          {/* Banners */}
          <div className="space-y-3">
            <div>
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Banner
              </Label>
              <p className="hidden text-xs text-muted-foreground mt-0.5">Add up to 3 banners (recommended)</p>
            </div>

            {
              uploadedBanners.length === 0 && (
            <div className="flex items-center gap-4">
              <Label className="text-xs">Upload banner <span className="text-destructive">*</span></Label>

              {availableTypes.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="w-auto">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {availableTypes.map(bt => (
                      <DropdownMenuItem key={bt.type} onClick={() => handleSelectType(bt.type)}>
                        <bt.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                        {bt.label} ({bt.dimensions})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
              )}

            {/* Uploaded banners list */}
            {uploadedBanners.length > 0 && (
              <div className="space-y-2">
                {uploadedBanners.map(banner => {
                  const typeInfo = BANNER_TYPES.find(b => b.type === banner.type)!;
                  return (
                    <div key={banner.type} className="flex items-center gap-3 border rounded-lg px-3 py-2">
                      {banner.preview && (
                        <img src={banner.preview} alt={typeInfo.label} className="h-10 w-10 object-contain rounded bg-muted" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{banner.fileName}</p>
                        <p className="text-xs text-muted-foreground">{typeInfo.label} — {typeInfo.dimensions}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeBanner(banner.type)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upload Dialog */}
          <Dialog open={uploadDialogOpen} onOpenChange={(open) => { setUploadDialogOpen(open); if (!open) setSelectedType(null); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Your {selectedTypeInfo?.label} Banner</DialogTitle>
                <DialogDescription>
                  Choose an image that will run alongside your audio ad.
                </DialogDescription>
              </DialogHeader>

              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Drag & drop your image file here or <span className="text-primary font-medium">browse</span>
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Upload a .JPEG, .JPG, .PNG, .GIF ({selectedTypeInfo?.dimensions} min, 6000×6000 max). Max file size: 5MB.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif"
                onChange={handleFileUpload}
                className="hidden"
              />
            </DialogContent>
          </Dialog>

          {/* Impression Pixel */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Impression Pixel <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              placeholder="https://tracker.example.com/pixel?campaign_id=..."
              value={data.impressionPixel}
              onChange={(e) => onChange({ ...data, impressionPixel: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Third-party impression tracking URL. Fires on each ad impression for verification.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
