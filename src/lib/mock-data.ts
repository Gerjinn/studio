
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

export const MOCK_VISITORS: Visitor[] = [
  { id: '1', name: 'John Doe', idNumber: '2023-0001', email: 'jdoe@neu.edu.ph', entryTime: '2024-05-20T08:30:00', college: 'CICS', program: 'BSIT', purpose: 'Assignment', role: 'Student' },
  { id: '2', name: 'Jane Smith', idNumber: '2023-0002', email: 'jsmith@neu.edu.ph', entryTime: '2024-05-20T09:15:00', college: 'Nursing', program: 'BSN', purpose: 'Researching', role: 'Student' },
  { id: '3', name: 'Alice Walker', idNumber: 'F-102', email: 'awalker@neu.edu.ph', entryTime: '2024-05-20T10:00:00', college: 'Education', program: 'Professional Education', purpose: 'Reading', role: 'Faculty' },
  { id: '4', name: 'Bob Brown', idNumber: '2023-0004', email: 'bbrown@neu.edu.ph', entryTime: '2024-05-19T14:20:00', college: 'Engineering', program: 'BSME', purpose: 'Board games', role: 'Student' },
  { id: '5', name: 'Charlie Davis', idNumber: '2023-0005', email: 'cdavis@neu.edu.ph', entryTime: '2024-05-18T11:45:00', college: 'CICS', program: 'BSCS', purpose: 'Use of Computer', role: 'Student' },
  { id: '6', name: 'Diana Prince', idNumber: '2023-0006', email: 'dprince@neu.edu.ph', entryTime: '2024-05-15T13:30:00', college: 'Arts & Sciences', program: 'BS Psych', purpose: 'Other', role: 'Student' },
];

export interface UserAccount {
  id: string;
  name: string;
  idNumber: string;
  college: string;
  email: string;
  type: 'Student' | 'Staff' | 'Faculty';
  status: 'Active' | 'Blocked';
}

export const MOCK_ACCOUNTS: UserAccount[] = [
  { id: '1', name: 'John Doe', idNumber: '2023-0001', college: 'CICS', email: 'jdoe@neu.edu.ph', type: 'Student', status: 'Active' },
  { id: '2', name: 'Jane Smith', idNumber: '2023-0002', college: 'Nursing', email: 'jsmith@neu.edu.ph', type: 'Student', status: 'Active' },
  { id: '3', name: 'Alice Walker', idNumber: 'F-102', college: 'Education', email: 'awalker@neu.edu.ph', type: 'Faculty', status: 'Active' },
  { id: '4', name: 'Mark Evans', idNumber: 'S-205', college: 'Admin', email: 'mevans@neu.edu.ph', type: 'Staff', status: 'Blocked' },
];
