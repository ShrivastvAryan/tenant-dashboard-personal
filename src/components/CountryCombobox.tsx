"use client";

import React, { useState, useMemo } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { ALLOWED_COUNTRIES } from "@/lib/countries";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface CountryComboboxProps {
  value?: string;
  onChange: (code: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CountryCombobox({
  value = "",
  onChange,
  placeholder = "Select country...",
  className = "",
  disabled = false,
}: CountryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCountry = useMemo(() => {
    if (!value) return null;
    const trimmed = value.trim().toUpperCase();
    return ALLOWED_COUNTRIES.find(
      (c) => c.code === trimmed || c.name.toUpperCase() === trimmed
    );
  }, [value]);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return ALLOWED_COUNTRIES;
    const q = search.trim().toLowerCase();
    return ALLOWED_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const displayTriggerText = selectedCountry
    ? `${selectedCountry.name} (${selectedCountry.code})`
    : value || placeholder;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={`h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm flex items-center justify-between outline-none bg-white hover:bg-slate-50 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <span
          className={`truncate mr-2 text-xs ${
            selectedCountry || value ? "text-[#0f172a] font-medium" : "text-[#94a3b8]"
          }`}
        >
          {displayTriggerText}
        </span>
        <ChevronsUpDown size={16} className="text-[#94a3b8] shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-[100]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search country or code..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-60 overflow-y-auto">
            {filteredCountries.length === 0 && (
              <CommandEmpty>No country found.</CommandEmpty>
            )}
            <CommandGroup>
              {filteredCountries.map((c) => {
                const isSelected = selectedCountry?.code === c.code || value === c.code;
                return (
                  <CommandItem
                    key={c.code}
                    value={c.code}
                    onSelect={() => {
                      onChange(c.code);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <span className="truncate pr-2">
                      <span className="font-medium mr-1.5">{c.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ({c.code})
                      </span>
                    </span>
                    {isSelected && <Check size={14} className="text-[var(--color-brand)] shrink-0 ml-2" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
