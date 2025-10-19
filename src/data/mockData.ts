import { User, Contact, ChangelogEntry } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', username: 'user@demo.com', email: 'user@demo.com', password: 'user123', role: 'user', name: 'John Smith', avatar: 'https://d64gsuwffb70l.cloudfront.net/68f3413b1bad1c5473744432_1760772456840_2d4d43a8.webp', employeeNumber: 'EMP001', position: 'EA' },
  { id: '2', username: 'admin@demo.com', email: 'admin@demo.com', password: 'admin123', role: 'admin', name: 'Sarah Johnson', avatar: 'https://d64gsuwffb70l.cloudfront.net/68f3413b1bad1c5473744432_1760772458560_f5047923.webp', employeeNumber: 'EMP002', position: 'Shared Services' },
  { id: '3', username: 'super@demo.com', email: 'super@demo.com', password: 'super123', role: 'superadmin', name: 'Michael Chen', avatar: 'https://d64gsuwffb70l.cloudfront.net/68f3413b1bad1c5473744432_1760772460303_bdb2d7f2.webp', employeeNumber: 'EMP003', position: 'EB' },
  { id: '4', username: 'user2@demo.com', email: 'user2@demo.com', password: 'user123', role: 'user', name: 'Emily Davis', avatar: 'https://d64gsuwffb70l.cloudfront.net/68f3413b1bad1c5473744432_1760772462001_8b7187e1.webp', employeeNumber: 'EMP004', position: 'Claims' },
];

export const generateMockContacts = (): Contact[] => {
  const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Elizabeth', 'Richard', 'Barbara', 'Joseph', 'Susan', 'Thomas', 'Jessica', 'Charles', 'Sarah', 'Christopher', 'Karen'];
  const middleNames = ['Lee', 'Ann', 'James', 'Marie', 'Ray', 'Lynn', 'Paul', 'Grace', 'Scott', 'Rose'];
  const lastNames = ['Anderson', 'Brown', 'Clark', 'Davis', 'Evans', 'Garcia', 'Harris', 'Jackson', 'Johnson', 'Lee', 'Martin', 'Miller', 'Moore', 'Rodriguez', 'Smith', 'Taylor', 'Thomas', 'White', 'Williams', 'Wilson'];
  const companies = ['Tech Corp', 'Global Industries', 'Innovate LLC', 'Prime Solutions', 'Apex Systems', 'NextGen Tech', 'Blue Sky Co', 'Quantum Labs', 'Stellar Group', 'Fusion Enterprises'];
  
  const contacts: Contact[] = [];
  const owners = MOCK_USERS.filter(u => u.role === 'user');
  
  // Get current date for upcoming birthdays
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  for (let i = 0; i < 40; i++) {
    const owner = owners[i % owners.length];
    let birthday: string;
    
    // Make first few contacts have upcoming birthdays for demonstration
    if (i < 5) {
      const daysFromNow = [2, 7, 15, 22, 28][i]; // Different upcoming dates
      const upcomingDate = new Date(today);
      upcomingDate.setDate(today.getDate() + daysFromNow);
      birthday = `1985-${String(upcomingDate.getMonth() + 1).padStart(2, '0')}-${String(upcomingDate.getDate()).padStart(2, '0')}`;
    } else {
      birthday = `19${80 + (i % 20)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`;
    }
    
    contacts.push({
      id: `c${i + 1}`,
      firstName: firstNames[i % firstNames.length],
      middleName: middleNames[i % middleNames.length],
      lastName: lastNames[i % lastNames.length],
      birthday,
      contactNumber: `+1-555-${String(1000 + i).padStart(4, '0')}`,
      company: companies[i % companies.length],
      ownerId: owner.id,
      ownerName: owner.name,
      createdAt: new Date(2024, i % 12, (i % 28) + 1).toISOString(),
    });
  }
  
  return contacts;
};

export const MOCK_CHANGELOG: ChangelogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    userId: '3',
    userName: 'Michael Chen',
    userRole: 'superadmin',
    action: 'create',
    entity: 'user',
    entityId: '4',
    entityName: 'Emily Davis',
    description: 'Created new user account',
    details: 'User account created with role: user, Employee Number: EMP004, Position: Claims'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    userId: '2',
    userName: 'Sarah Johnson',
    userRole: 'admin',
    action: 'update',
    entity: 'contact',
    entityId: 'contact-1',
    entityName: 'John Doe',
    description: 'Updated contact information',
    details: 'Modified contact number and company information'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    userId: '1',
    userName: 'John Smith',
    userRole: 'user',
    action: 'export',
    entity: 'contact',
    description: 'Exported contacts to CSV',
    details: 'Exported 15 contacts from personal contacts list'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    userId: '4',
    userName: 'Emily Davis',
    userRole: 'user',
    action: 'login',
    entity: 'system',
    description: 'User logged into the system',
    details: 'Successful login from IP: 192.168.1.100'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    userId: '3',
    userName: 'Michael Chen',
    userRole: 'superadmin',
    action: 'delete',
    entity: 'contact',
    entityId: 'contact-deleted-1',
    entityName: 'Deleted Contact',
    description: 'Deleted contact from system',
    details: 'Contact permanently removed from collaborative contacts'
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    userId: '1',
    userName: 'John Smith',
    userRole: 'user',
    action: 'download',
    entity: 'contact',
    entityId: 'contact-2',
    entityName: 'Jane Smith',
    description: 'Downloaded VCF file',
    details: 'Downloaded contact information as VCF file'
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    userId: '2',
    userName: 'Sarah Johnson',
    userRole: 'admin',
    action: 'create',
    entity: 'contact',
    entityId: 'contact-3',
    entityName: 'Robert Wilson',
    description: 'Added new contact',
    details: 'Contact added to collaborative contacts with all required information'
  },
  {
    id: '8',
    timestamp: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
    userId: '4',
    userName: 'Emily Davis',
    userRole: 'user',
    action: 'logout',
    entity: 'system',
    description: 'User logged out of the system',
    details: 'Session ended after 2 hours of activity'
  },
  {
    id: '9',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    userId: '3',
    userName: 'Michael Chen',
    userRole: 'superadmin',
    action: 'update',
    entity: 'user',
    entityId: '2',
    entityName: 'Sarah Johnson',
    description: 'Updated user role permissions',
    details: 'Changed user role from user to admin with extended permissions'
  },
  {
    id: '10',
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    userId: '1',
    userName: 'John Smith',
    userRole: 'user',
    action: 'create',
    entity: 'contact',
    entityId: 'contact-4',
    entityName: 'Alice Brown',
    description: 'Created personal contact',
    details: 'Added new contact to personal contacts list with birthday and company info'
  }
];
