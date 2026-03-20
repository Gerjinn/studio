
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
