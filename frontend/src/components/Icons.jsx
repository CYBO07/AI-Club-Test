// Minimal, dependency-free line icons (24x24, currentColor) used throughout the UI.
import React from "react";

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export const Icon = {
  overview: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>,
  students: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"/><circle cx="9" cy="7" r="4"/><path d="M22 19v-1a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bank: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M4 10h16"/><path d="M4 21V10l8-6 8 6v11"/><path d="M9 21v-6h6v6"/></svg>,
  tests: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z"/><rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 12h6M9 16h6M9 9h1"/></svg>,
  results: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M3 3v18h18"/><path d="M7 15l3-4 3 3 5-7"/></svg>,
  analytics: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></svg>,
  categories: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>,
  settings: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>,
  logout: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>,
  search: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>,
  plus: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M12 5v14M5 12h14"/></svg>,
  upload: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M12 16V4M6 10l6-6 6 6"/><path d="M4 20h16"/></svg>,
  download: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M12 4v12M6 10l6 6 6-6"/><path d="M4 20h16"/></svg>,
  clock: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  check: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M20 6 9 17l-5-5"/></svg>,
  x: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  chevronRight: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="m9 18 6-6-6-6"/></svg>,
  chevronLeft: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="m15 18-6-6 6-6"/></svg>,
  menu: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M4 7h16M4 12h16M4 17h16"/></svg>,
  flag: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22V15"/></svg>,
  trophy: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4a1 1 0 0 0-1 1 5 5 0 0 0 4 5"/><path d="M17 5h3a1 1 0 0 1 1 1 5 5 0 0 1-4 5"/></svg>,
  trend: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>,
  alert: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>,
  user: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>,
  eye: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  copy: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>,
  trash: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  edit: (p) => <svg viewBox="0 0 24 24" width={p.size||18} height={p.size||18} {...base}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>,
};
