
export const COLLEGES = [
  'CICS',
  'Education',
  'Nursing',
  'Arts & Sciences',
  'Engineering',
  'Business Administration',
  'Architecture',
  'Music'
];

export const PROGRAMS: Record<string, string[]> = {
  'CICS': ['BSIT', 'BSCS', 'BSIS'],
  'Engineering': ['BSME', 'BSEE', 'BSCE', 'BSECE'],
  'Nursing': ['BSN'],
  'Business Administration': ['BSBA', 'BSA'],
};

export const VISIT_PURPOSES = [
  'Assignment',
  'Use of Computer',
  'Board games',
  'Researching',
  'Reading',
  'Other'
];

export interface Visitor {
  id: string;
  name: string;
  idNumber: string;
  email: string;
  entryTime: string;
  college: string;
  program: string;
  purpose: string;
  role: 'Student' | 'Staff' | 'Faculty' | 'Admin';
}

export interface UserAccount {
  id: string;
  name: string;
  idNumber: string;
  college: string;
  email: string;
  type: 'Student' | 'Staff' | 'Faculty';
  status: 'active' | 'blocked';
}
