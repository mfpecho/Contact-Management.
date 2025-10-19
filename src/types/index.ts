export type UserRole = 'user' | 'admin' | 'superadmin';

export interface VCFDownloadRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  contactId: string;
  contactName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  avatar: string;
  employeeNumber: string;
  position: string;
}

export interface Contact {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthday: string;
  contactNumber: string;
  company: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export type ChangelogAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'download';
export type ChangelogEntity = 'contact' | 'user' | 'system';

export interface ChangelogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: ChangelogAction;
  entity: ChangelogEntity;
  entityId?: string;
  entityName?: string;
  description: string;
  details?: string;
}
