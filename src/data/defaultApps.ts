import type { WorkflowAppInput } from '../types/app'

/**
 * Seed/default catalog of workflow apps. This is only used the first time
 * the app runs (to populate Firestore's shared `apps` collection when it is
 * empty) or as an offline fallback if Firestore is unreachable. After that,
 * the live data in Firestore is the source of truth, and apps can be freely
 * added or removed from the "Manage Apps" screen without touching code.
 *
 * These are illustrative example apps with placeholder URLs - swap them
 * out for your own team's tools from the "Manage Apps" screen.
 */
const rawDefaultApps: Omit<WorkflowAppInput, 'ownerIsAdmin'>[] = [
  {
    name: 'Shiftly',
    description: 'Staff scheduling & time clock',
    url: 'https://login.shiftly.example.com',
    color: '#00b1b2',
    category: 'Scheduling',
    androidPackage: 'com.example.shiftly',
    iosAppStoreId: 'id0000000001',
    order: 0,
    enabled: true,
  },
  {
    name: 'PeopleHub',
    description: 'HR management platform',
    url: 'https://login.peoplehub.example.com',
    color: '#00295b',
    category: 'HR',
    androidPackage: 'com.example.peoplehub',
    iosAppStoreId: 'id0000000002',
    order: 1,
    enabled: true,
  },
  {
    name: 'Workspace Suite',
    description: 'Email, Drive, Calendar & more',
    url: 'https://workspace.example.com/dashboard',
    color: '#4285f4',
    category: 'Productivity',
    loginMethod: 'google',
    order: 2,
    enabled: true,
  },
  {
    name: 'MarketCart',
    description: 'Business shopping & orders',
    url: 'https://www.marketcart.example.com',
    color: '#ff9900',
    category: 'Shopping',
    order: 3,
    enabled: true,
  },
  {
    name: 'HireBoard',
    description: 'Recruitment & job postings',
    url: 'https://employers.hireboard.example.com',
    color: '#2164f3',
    category: 'Recruitment',
    order: 4,
    enabled: true,
  },
  {
    name: 'CompliancePro',
    description: 'Policy & compliance dashboard',
    url: 'https://compliance.example.com',
    color: '#7b2d8e',
    category: 'Compliance',
    order: 5,
    enabled: true,
  },
  {
    name: 'OpsTrack',
    description: 'Field operations management',
    url: 'https://www.opstrack.example.com',
    color: '#2a9d5c',
    category: 'Operations',
    order: 6,
    enabled: true,
  },
  {
    name: 'AccessPortal',
    description: 'Operations & compliance access portal',
    url: 'https://accessportal.example.com',
    color: '#0e6ba8',
    category: 'Operations',
    order: 7,
    enabled: true,
  },
  {
    name: 'VerifyNow',
    description: 'Background & identity verification',
    url: 'https://www.verifynow.example.com',
    color: '#d62839',
    category: 'Verification',
    order: 8,
    enabled: true,
  },
]

// The seed catalog represents an illustrative "official" app list, so treat
// it as admin-given (members can edit its name/sign-in but not remove it).
export const defaultApps: WorkflowAppInput[] = rawDefaultApps.map((app) => ({
  ...app,
  ownerIsAdmin: true,
}))
