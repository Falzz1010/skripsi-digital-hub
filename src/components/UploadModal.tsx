
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal = ({ isOpen, onClose }: UploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Hanya file PDF dan DOCX yang diizinkan");
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 10MB");
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fileType) {
      toast.error("Pilih file dan jenis dokumen terlebih dahulu");
      return;
    }

    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      toast.success("File berhasil diupload!");
      setIsUploading(false);
      setSelectedFile(null);
      setFileType("");
      setDescription("");
      onClose();
    }, 2000);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <span>Upload File Skripsi</span>
          </DialogTitle>
          <DialogDescription>
            Upload file skripsi, proposal, atau revisi dalam format PDF atau DOCX
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Pilih File</Label>
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Drag & drop file atau klik untuk browse</p>
                <Input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>Pilih File</span>
                  </Button>
                </Label>
                <p className="text-xs text-gray-500 mt-2">PDF atau DOCX, maksimal 10MB</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removeFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* File Type Selection */}
          <div className="space-y-2">
            <Label>Jenis Dokumen</Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis dokumen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proposal">Proposal Skripsi</SelectItem>
                <SelectItem value="bab1">Bab 1 - Pendahuluan</SelectItem>
                <SelectItem value="bab2">Bab 2 - Tinjauan Pustaka</SelectItem>
                <SelectItem value="bab3">Bab 3 - Metodologi</SelectItem>
                <SelectItem value="bab4">Bab 4 - Hasil dan Pembahasan</SelectItem>
                <SelectItem value="bab5">Bab 5 - Kesimpulan</SelectItem>
                <SelectItem value="full">Draft Lengkap</SelectItem>
                <SelectItem value="revision">Revisi</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Catatan (Opsional)</Label>
            <Textarea
              placeholder="Tambahkan catatan atau deskripsi mengenai file ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || !selectedFile || !fileType}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
