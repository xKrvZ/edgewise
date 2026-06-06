'use client';

import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggleMenu() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const value = theme ?? 'system';

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Theme
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup value={value} onValueChange={setTheme}>
        <DropdownMenuRadioItem value="light">
          <Sun className="h-4 w-4" />
          Light
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="dark">
          <Moon className="h-4 w-4" />
          Dark
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="system">
          <Monitor className="h-4 w-4" />
          System
          {value === 'system' && resolvedTheme ? (
            <span className="ml-auto text-xs text-muted-foreground capitalize">
              ({resolvedTheme})
            </span>
          ) : null}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
}
