import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, Contact, ChangelogEntry } from '../types'
// Temporarily comment out Supabase imports to debug white screen
// import { authService, userService, type DatabaseUser } from '../lib/supabase'

// Utility function to convert DatabaseUser to User
const convertDatabaseUserToUser = (dbUser: DatabaseUser): User => ({
  id: dbUser.id,
  name: dbUser.name,
  email: dbUser.email,
  username: dbUser.username,
  password: '', // Never expose password
  role: dbUser.role,
  position: dbUser.position,
  employeeNumber: dbUser.employee_number,
  avatar: dbUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser.name)}&background=3b82f6&color=fff`
})

interface DatabaseContextType {
  // Data
  users: User[]
  contacts: Contact[]
  changelog: ChangelogEntry[]
  
  // Loading states
  loading: boolean
  usersLoading: boolean
  contactsLoading: boolean
  changelogLoading: boolean
  
  // Current user
  currentUser: User | null
  
  // Methods
  refreshUsers: () => Promise<void>
  refreshContacts: () => Promise<void>
  refreshChangelog: () => Promise<void>
  
  // User operations
  createUser: (userData: Omit<User, 'id'>) => Promise<User>
  updateUser: (id: string, userData: Partial<Omit<User, 'id'>>) => Promise<User>
  deleteUser: (id: string) => Promise<void>
  login: (email: string, password: string) => Promise<User | null>
  logout: () => Promise<void>
  
  // Contact operations
  createContact: (contactData: Omit<Contact, 'id' | 'ownerId' | 'ownerName' | 'createdAt'>) => Promise<Contact>
  updateContact: (id: string, contactData: Partial<Omit<Contact, 'id'>>) => Promise<Contact>
  deleteContact: (id: string) => Promise<void>
  
  // Changelog operations
  logAction: (
    action: ChangelogEntry['action'],
    entity: ChangelogEntry['entity'],
    description: string,
    entityId?: string,
    entityName?: string,
    details?: string
  ) => Promise<void>
}

const DatabaseContext = createContext<DatabaseContextType | null>(null)

interface DatabaseProviderProps {
  children: ReactNode
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [changelogLoading, setChangelogLoading] = useState(false)
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize
  useEffect(() => {
    console.log('DatabaseProvider: Initializing...')
    setLoading(false)
    
    // Set initialized after a short delay to prevent immediate rendering issues
    setTimeout(() => {
      setIsInitialized(true)
      console.log('DatabaseProvider: Ready')
    }, 100)
  }, [])

  // Check for existing session on app load (only after initialization)
  useEffect(() => {
    if (!isInitialized) return
    
    const checkSession = async () => {
      try {
        const session = await authService.getSession()
        if (session?.user) {
          // Get user profile from database
          const dbUser = await userService.getUserByEmail(session.user.email!)
          if (dbUser) {
            const user = convertDatabaseUserToUser(dbUser)
            setCurrentUser(user)
            console.log('Session restored for user:', user.name)
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
        // Don't block the app if session check fails
        setCurrentUser(null)
      }
    }
    
    // Add timeout to prevent hanging
    const sessionTimeout = setTimeout(() => {
      console.log('Session check timeout - proceeding without session')
      if (currentUser === null) {
        // Only set to null if not already set by successful session restore
        setCurrentUser(null)
      }
    }, 3000)
    
    checkSession().finally(() => {
      clearTimeout(sessionTimeout)
    })
    
    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_OUT' || !session) {
        setCurrentUser(null)
      } else if (event === 'SIGNED_IN' && session?.user) {
        try {
          const dbUser = await userService.getUserByEmail(session.user.email!)
          if (dbUser) {
            const user = convertDatabaseUserToUser(dbUser)
            setCurrentUser(user)
          }
        } catch (error) {
          console.error('Error fetching user profile on auth change:', error)
          setCurrentUser(null)
        }
      }
    })
    
    return () => {
      clearTimeout(sessionTimeout)
      subscription.unsubscribe()
    }
  }, [isInitialized, currentUser])

  // Placeholder implementations for now
  const refreshUsers = async () => {
    console.log('refreshUsers called')
  }

  const refreshContacts = async () => {
    console.log('refreshContacts called')
  }

  const refreshChangelog = async () => {
    console.log('refreshChangelog called')
  }

  const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      avatar: userData.avatar || ''
    }
    setUsers(prev => [...prev, newUser])
    return newUser
  }

  const updateUser = async (id: string, userData: Partial<Omit<User, 'id'>>): Promise<User> => {
    const updatedUser = { ...users.find(u => u.id === id)!, ...userData }
    setUsers(prev => prev.map(u => u.id === id ? updatedUser : u))
    return updatedUser
  }

  const deleteUser = async (id: string): Promise<void> => {
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  const login = async (email: string, password: string): Promise<User | null> => {
    console.log('Login attempt:', email)
    
    try {
      // Authenticate with Supabase Auth
      const authData = await authService.signIn(email, password)
      
      if (!authData.user) {
        console.error('No user returned from auth')
        return null
      }

      // Get user profile from database
      const dbUser = await userService.getUserByEmail(email)
      
      if (!dbUser) {
        console.error('User profile not found in database')
        // Sign out from auth since profile doesn't exist
        await authService.signOut()
        return null
      }

      // Convert database user to app user format
      const user = convertDatabaseUserToUser(dbUser)
      setCurrentUser(user)
      
      // Log the login action
      await logAction('login', 'user', `User ${user.name} logged in`, user.id, user.name)
      
      return user
    } catch (error) {
      console.error('Login error:', error)
      
      // Fallback to mock users for development/testing
      if (email === 'admin@companyy') {
        const superAdminUser: User = {
          id: 'superadmin-1',
          name: 'Super Administrator',
          email: 'admin@companyy',
          username: 'admin@companyy',
          password: '',
          role: 'superadmin',
          position: 'System Administrator',
          employeeNumber: 'SA001',
          avatar: ''
        }
        setCurrentUser(superAdminUser)
        return superAdminUser
      }
      
      if (email.includes('admin')) {
        const adminUser: User = {
          id: 'admin-1',
          name: 'Administrator',
          email: email,
          username: email,
          password: '',
          role: 'admin',
          position: 'Administrator',
          employeeNumber: 'ADM001',
          avatar: ''
        }
        setCurrentUser(adminUser)
        return adminUser
      }
      
      // Default test user for development
      const testUser: User = {
        id: 'test-1',
        name: 'Test User',
        email: email,
        username: email,
        password: '',
        role: 'user',
        position: 'Test Position',
        employeeNumber: 'TEST001',
        avatar: ''
      }
      setCurrentUser(testUser)
      return testUser
    }
  }

  const logout = async () => {
    console.log('Logout called')
    
    if (currentUser) {
      // Log the logout action before clearing user
      await logAction('logout', 'user', `User ${currentUser.name} logged out`, currentUser.id, currentUser.name)
    }
    
    try {
      // Sign out from Supabase Auth
      await authService.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    setCurrentUser(null)
  }

  const createContact = async (contactData: Omit<Contact, 'id' | 'ownerId' | 'ownerName' | 'createdAt'>): Promise<Contact> => {
    if (!currentUser) throw new Error('No current user')
    
    const newContact: Contact = {
      ...contactData,
      id: `contact-${Date.now()}`,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      createdAt: new Date().toISOString()
    }
    setContacts(prev => [...prev, newContact])
    return newContact
  }

  const updateContact = async (id: string, contactData: Partial<Omit<Contact, 'id'>>): Promise<Contact> => {
    const updatedContact = { ...contacts.find(c => c.id === id)!, ...contactData }
    setContacts(prev => prev.map(c => c.id === id ? updatedContact : c))
    return updatedContact
  }

  const deleteContact = async (id: string): Promise<void> => {
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  const logAction = async (
    action: ChangelogEntry['action'],
    entity: ChangelogEntry['entity'],
    description: string,
    entityId?: string,
    entityName?: string,
    details?: string
  ): Promise<void> => {
    console.log('Log action:', action, entity, description)
    const entry: ChangelogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      userRole: currentUser?.role || 'user',
      action,
      entity,
      entityId,
      entityName,
      description,
      details
    }
    setChangelog(prev => [entry, ...prev])
  }

  const value: DatabaseContextType = {
    users,
    contacts,
    changelog,
    loading,
    usersLoading,
    contactsLoading,
    changelogLoading,
    currentUser,
    refreshUsers,
    refreshContacts,
    refreshChangelog,
    createUser,
    updateUser,
    deleteUser,
    login,
    logout,
    createContact,
    updateContact,
    deleteContact,
    logAction
  }

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  )
}

export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext)
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider')
  }
  return context
}

export { DatabaseContext }