import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ImagePreviewProps {
  children: React.ReactElement<any>;
  src: string;
  alt?: string;
}

export function ImagePreview({ children, src, alt }: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  // We clone the child to add onClick handler, cursor pointer, and hover effects
  const trigger = React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen(true);
    },
    className: `${children.props.className || ""} cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-95`,
    title: "Click to preview image"
  });

  return (
    <>
      {trigger}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          hideClose
          className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black/95 border-none flex items-center justify-center rounded-xl shadow-2xl"
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-black/60 hover:bg-black/80 p-2 text-white/80 hover:text-white transition-colors z-50 cursor-pointer border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 sm:p-10 select-none">
            {React.cloneElement(children, {
              className: "max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-300",
              style: { ...children.props.style, width: "auto", height: "auto", maxHeight: "80vh" },
              onClick: undefined // no-op inside preview
            })}
            {alt && (
              <p className="mt-4 text-xs font-medium text-white/60 text-center tracking-wide">
                {alt}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
