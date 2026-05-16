/**
 * Design System Tokens — Responsive, mobile-first
 *
 * Conventions:
 *  - Mobile-first: base classes = mobile, md: = tablet, lg: = desktop
 *  - Admin pages use .ds-content (content area)
 *  - Tables use .ds-table-wrapper + .ds-table-row on mobile
 *  - Cards use .ds-card-standard padding scale
 */

// ─── Responsive container widths ───
export const CONTAINER = {
  content: "max-w-7xl mx-auto w-full",        // admin full-width content
  employee: "max-w-3xl mx-auto w-full",       // employee narrow content
  narrow: "max-w-2xl mx-auto w-full",         // forms, settings
} as const

// ─── Page padding (applied to <main>'s inner div) ───
export const PAGE_PADDING = "p-3 sm:p-4 md:p-6 lg:p-8"

// ─── Standard vertical spacing between sections ───
export const STACK = {
  page: "space-y-4 sm:space-y-6",       // page-level sections
  section: "space-y-3 sm:space-y-4",    // within a card
  form: "space-y-3 sm:space-y-4",       // form fields
  tight: "space-y-2 sm:space-y-3",      // compact groups
} as const

// ─── Card padding scale ───
export const CARD_PADDING = {
  standard: "p-3 sm:p-4 md:p-5",       // most cards
  compact: "p-2 sm:p-3 md:p-4",        // stat cards, small widgets
  spacious: "p-4 sm:p-6 md:p-8",       // hero sections, empty states
  table: "p-0 sm:p-0",                  // table wrapper cards (use .ds-table-wrapper)
} as const

// ─── Grid breakpoint presets ───
export const GRID = {
  stat4: "grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4",
  stat3: "grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4",
  stat2: "grid grid-cols-2 gap-3 sm:gap-4",
  cards3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4",
  cards2: "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4",
  form2: "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4",
  form3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4",
  filters: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3",
} as const

// ─── Typography scale (responsive) ───
export const TEXT = {
  pageTitle: "text-xl sm:text-2xl md:text-3xl font-bold tracking-tight",
  sectionTitle: "text-base sm:text-lg font-semibold",
  cardTitle: "text-sm sm:text-base font-semibold",
  body: "text-sm text-muted-foreground",
  small: "text-xs text-muted-foreground",
  mono: "font-mono text-sm",
  kpi: "text-xl sm:text-2xl md:text-3xl font-bold font-mono",
  label: "text-xs sm:text-sm font-medium text-muted-foreground",
} as const

// ─── Flex layout presets ───
export const FLEX = {
  between: "flex items-center justify-between flex-wrap gap-2",
  betweenNowrap: "flex items-center justify-between gap-3",
  center: "flex items-center gap-2",
  start: "flex items-start gap-2",
  end: "flex items-center justify-end gap-2",
  col: "flex flex-col gap-2",
  row: "flex flex-row flex-wrap items-center gap-2 sm:gap-3",
} as const

// ─── Buttons ───
export const BUTTON = {
  primary: "w-full sm:w-auto",
  icon: "w-9 h-9",
  iconSm: "w-8 h-8",
} as const

// ─── Tables → mobile cards ───
//
// Usage:
//   <Card className={CARD_PADDING.table}>
//     <div className="ds-table-wrapper">
//       <table className="ds-table">...</table>
//     </div>
//   </Card>
//
// On mobile (< sm), the <table> is hidden and each <tr> renders as a card via .ds-table-row
// You must add .ds-table-row to each <tr> you want shown as a card on mobile.
//
// CSS (already in index.css — add these classes):
export const TABLE = {
  wrapper: "overflow-x-auto ds-table-wrapper",
  table: "w-full ds-table",
  row: "ds-table-row",
  th: "text-left p-2 sm:p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap",
  td: "p-2 sm:p-3",
  tdLabel: "ds-td-label",
} as const

// ─── Dialog / Modal ───
export const DIALOG = {
  content: "sm:max-w-lg max-h-[85vh] overflow-y-auto",
  fullMobile: "sm:max-w-lg w-full sm:w-auto",  // fullscreen on mobile, dialog on desktop
  header: "space-y-1 pb-2",
} as const

// ─── Helper to build className strings ───
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ")
}

// ─── Responsive visibility ───
export const HIDE = {
  mobile: "hidden sm:block",       // hide on mobile, show on tablet+
  desktop: "sm:hidden",            // show on mobile, hide on tablet+
}
