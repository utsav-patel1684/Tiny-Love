import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}

export function HeaderDropdown({ value, onChange, options, placeholder }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-white/90 hover:text-white cursor-pointer select-none focus:outline-none"
      >
        <span>{selectedOption && selectedOption.value !== "" ? selectedOption.label : placeholder}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 min-w-[150px] max-w-[280px] max-h-[240px] overflow-y-auto rounded-lg border border-border bg-card text-white shadow-xl z-50 py-1 dropdown-scrollbar animate-in fade-in-0 zoom-in-95 duration-100">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full text-left px-3.5 py-1.5 text-xs font-normal normal-case cursor-pointer transition-colors ${
                value === opt.value
                  ? "bg-[#EBA545] text-white"
                  : "hover:bg-[#EBA545] hover:text-white text-white/95"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
