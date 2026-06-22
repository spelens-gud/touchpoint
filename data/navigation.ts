export interface PrimaryNavItem {
  label: string;
  displayLabel: string;
  hash: string;
  code: string;
  cursorLabel: string;
  shortHint: string;
  easterHint: string;
}

export const primaryNavItems: PrimaryNavItem[] = [
  {
    label: 'Portfolio',
    displayLabel: 'PORTFOLIO',
    hash: 'works',
    code: 'SEC-001',
    cursorLabel: 'PORTFOLIO',
    shortHint: 'Project archive',
    easterHint: 'THINGS THAT SURVIVED',
  },
  {
    label: 'Experience',
    displayLabel: 'EXPERIENCE',
    hash: 'experience',
    code: 'SEC-002',
    cursorLabel: 'EXPERIENCE',
    shortHint: 'Timeline record',
    easterHint: 'OLD ROADS STILL SIGNAL',
  },
  {
    label: 'Blog',
    displayLabel: 'BLOG',
    hash: 'blog',
    code: 'SEC-003',
    cursorLabel: 'BLOG',
    shortHint: 'Signal log',
    easterHint: 'FIELD NOTES FROM THE DUST',
  },
  {
    label: 'Life',
    displayLabel: 'LIFE',
    hash: 'life',
    code: 'SEC-004',
    cursorLabel: 'LIFE',
    shortHint: 'Life fragments',
    easterHint: 'SOFT DATA STILL BREATHES',
  },
  {
    label: 'Contact',
    displayLabel: 'CONTACT',
    hash: 'contact',
    code: 'SEC-005',
    cursorLabel: 'CONTACT',
    shortHint: 'Contact channel',
    easterHint: 'PING RETURNED FROM OUTPOST',
  },
  {
    label: 'About',
    displayLabel: 'ABOUT',
    hash: 'about',
    code: 'SEC-006',
    cursorLabel: 'ABOUT',
    shortHint: 'System profile',
    easterHint: 'IDENTITY TRACE NOT EMPTY',
  },
];
