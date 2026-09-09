'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HOTKEY_PRIORITY, useHotkey } from '@/lib/keyboard/index.ts';
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/use-media-query.ts';
import { type SettingsSection, settingsSectionsFlat } from './settings-sections.ts';
import { useSettingsNav } from './use-settings-nav.ts';

function sectionIndex(sections: readonly SettingsSection[], pathname: string): number {
  const index = sections.findIndex((section) => section.href === pathname);
  return index === -1 ? 0 : index;
}

export interface UseSettingsSidebarNavigationOptions {
  readonly passwordEnabled: boolean;
  readonly pathname: string;
}

export function useSettingsSidebarNavigation({
  passwordEnabled,
  pathname,
}: UseSettingsSidebarNavigationOptions) {
  const router = useRouter();
  const { close, open } = useSettingsNav();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const sidebarInteractive = open || isDesktop;
  const sections = useMemo(() => settingsSectionsFlat(passwordEnabled), [passwordEnabled]);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const routeIndex = sectionIndex(sections, pathname);
  const [focusIndex, setFocusIndex] = useState(routeIndex);

  useEffect(() => {
    setFocusIndex(routeIndex);
  }, [routeIndex]);

  const focusLink = useCallback((index: number) => {
    linkRefs.current[index]?.focus();
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      setFocusIndex((current) => {
        const next = Math.min(Math.max(current + direction, 0), sections.length - 1);
        focusLink(next);
        return next;
      });
    },
    [focusLink, sections.length],
  );

  const openFocused = useCallback(() => {
    const section = sections[focusIndex];
    if (section === undefined) return;
    const focusedLink = linkRefs.current[focusIndex];
    if (focusedLink === null || focusedLink === undefined) return;
    if (document.activeElement !== focusedLink) return;
    router.push(section.href);
    close();
  }, [close, focusIndex, router, sections]);

  useHotkey('j', () => step(1), {
    label: 'Next settings section',
    section: 'Settings',
    scope: 'settings',
    priority: HOTKEY_PRIORITY.surface,
    enabled: sidebarInteractive,
    aliases: ['down'],
  });
  useHotkey('k', () => step(-1), {
    label: 'Previous settings section',
    section: 'Settings',
    scope: 'settings',
    priority: HOTKEY_PRIORITY.surface,
    enabled: sidebarInteractive,
    aliases: ['up'],
  });
  useHotkey('enter', openFocused, {
    label: 'Open focused settings section',
    section: 'Settings',
    scope: 'settings',
    priority: HOTKEY_PRIORITY.surface,
    enabled: sidebarInteractive,
    preventDefault: false,
  });

  const registerLinkRef = useCallback((index: number, node: HTMLAnchorElement | null) => {
    linkRefs.current[index] = node;
  }, []);

  return {
    sections,
    focusIndex,
    registerLinkRef,
  };
}
