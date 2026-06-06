'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, X } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  color?: string | null;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select…',
  emptyText = 'No options.',
  className,
}: MultiSelectProps) {
  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const selectedOptions = options.filter((o) => selected.includes(o.value));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          // biome-ignore lint/a11y/useSemanticElements: composite trigger.
          role="combobox"
          className={cn(
            'h-auto min-h-9 w-full justify-between px-3 font-normal hover:bg-background',
            className,
          )}
        >
          <span className="flex flex-wrap gap-1">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedOptions.map((o) => (
                <Badge
                  key={o.value}
                  variant="secondary"
                  className="gap-1"
                  style={o.color ? { backgroundColor: `${o.color}22`, color: o.color } : undefined}
                >
                  {o.label}
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remove ${o.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(o.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        toggle(o.value);
                      }
                    }}
                    className="ml-0.5 inline-flex cursor-pointer rounded-full hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start">
        {options.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ScrollArea className="max-h-60">
            <div className="flex flex-col">
              {options.map((o) => {
                const isSelected = selected.includes(o.value);
                return (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => toggle(o.value)}
                    className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="flex items-center gap-2">
                      {o.color && (
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: o.color }}
                        />
                      )}
                      {o.label}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
