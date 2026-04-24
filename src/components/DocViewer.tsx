import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

interface DocViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  title: string;
  filename: string;
}

function getExt(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

const OFFICE_EXTS = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx"]);
const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]);
const TEXT_EXTS = new Set(["txt", "md", "csv", "log", "json", "xml", "yaml", "yml", "py", "js", "ts", "tsx", "jsx", "html", "css"]);

export function DocViewer({ open, onOpenChange, url, title, filename }: DocViewerProps) {
  const ext = getExt(filename);
  const isOffice = OFFICE_EXTS.has(ext);
  const isPdf = ext === "pdf";
  const isImage = IMAGE_EXTS.has(ext);
  const isText = TEXT_EXTS.has(ext);

  const viewerSrc = url
    ? isOffice
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
      : url
    : "";

  const downloadUrl = url ? `${url}${url.includes("?") ? "&" : "?"}download=${encodeURIComponent(filename)}` : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="pl-4 pr-12 py-3 border-b flex-row items-center justify-between gap-4 space-y-0">
          <DialogTitle className="truncate flex-1 min-w-0">{title}</DialogTitle>
          <div className="flex gap-2 shrink-0 mr-4">
            {url && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" /> Open
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={downloadUrl}>
                    <Download className="h-4 w-4 mr-1" /> Download
                  </a>
                </Button>
              </>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted">
          {!url ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : isImage ? (
            <div className="h-full flex items-center justify-center p-4">
              <img src={url} alt={title} className="max-h-full max-w-full object-contain" />
            </div>
          ) : isPdf ? (
            <object data={url} type="application/pdf" className="w-full h-full bg-background">
              <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground p-6 text-center">
                <p>Your browser blocked the inline PDF viewer.</p>
                <Button asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> Open in new tab
                  </a>
                </Button>
              </div>
            </object>
          ) : isOffice || isText ? (
            <iframe
              src={viewerSrc}
              title={title}
              className="w-full h-full border-0 bg-background"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground p-6 text-center">
              <p>Preview not available for this file type.</p>
              <Button asChild>
                <a href={downloadUrl}>
                  <Download className="h-4 w-4 mr-2" /> Download to view
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
