import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { User, Contact, ChangelogEntry, UserRole } from '../types'
import { superAdminService, testSupabaseConnection, supabase } from '../lib/supabase'
import { toast } from '../hooks/use-toast'

// Database contact interface for real-time events
interface DatabaseContact {
  first_name: string
  last_name: string
  [key: string]: unknown
}

// Simple mock context for debugging
interface DatabaseContextType {
  users: User[]
  contacts: Contact[]
  changelog: ChangelogEntry[]
  loading: boolean
  usersLoading: boolean
  contactsLoading: boolean
  changelogLoading: boolean
  isInitializing: boolean
  currentUser: User | null
  refreshUsers: () => Promise<void>
  refreshContacts: () => Promise<void>
  refreshChangelog: () => Promise<void>
  forceRefreshFromDatabase: () => Promise<void>
  syncContactsToDatabase: () => Promise<void>
  createUser: (userData: Omit<User, 'id'>) => Promise<User>
  updateUser: (id: string, userData: Partial<Omit<User, 'id'>>) => Promise<User>
  deleteUser: (id: string) => Promise<void>
  login: (email: string, password: string) => Promise<User | null>
  logout: () => Promise<void>
  createContact: (contactData: Omit<Contact, 'id' | 'ownerId' | 'ownerName' | 'createdAt'>) => Promise<Contact>
  updateContact: (id: string, contactData: Partial<Omit<Contact, 'id'>>) => Promise<Contact>
  deleteContact: (id: string) => Promise<void>
  logAction: (
    action: ChangelogEntry['action'],
    entity: ChangelogEntry['entity'],
    description: string,
    entityId?: string,
    entityName?: string,
    details?: string
  ) => Promise<void>
  // SuperAdmin functions
  createUserBySuperAdmin: (userData: {
    email: string
    password: string
    name: string
    username: string
    employeeNumber: string
    position: string
    role: User['role']
  }) => Promise<User>
  resetUserPassword: (userId: string, newPassword: string) => Promise<void>
  generateUsername: (name: string, employeeNumber: string) => Promise<string>
}

const DatabaseContext = createContext<DatabaseContextType | null>(null)

// Custom hook to use the DatabaseContext
export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext)
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider')
  }
  return context
}

interface DatabaseProviderProps {
  children: ReactNode
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  
  // Helper functions for session-based storage
  const getSessionData = (key: string) => {
    try {
      return sessionStorage.getItem(key) || localStorage.getItem(key)
    } catch {
      return localStorage.getItem(key)
    }
  }
  
  const setSessionData = (key: string, value: string) => {
    try {
      // Store in sessionStorage for current session
      sessionStorage.setItem(key, value)
      // Also backup to localStorage for persistence across API calls
      if (key === 'contacts' || key === 'lastContactSync') {
        localStorage.setItem(key, value)
      }
    } catch {
      localStorage.setItem(key, value)
    }
  }
  
  const clearSessionData = (key: string) => {
    try {
      sessionStorage.removeItem(key)
      localStorage.removeItem(key)
    } catch {
      localStorage.removeItem(key)
    }
  }
  
  const [users, setUsers] = useState<User[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  
  const [loading, setLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [changelogLoading, setChangelogLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)


  // Simple mock implementations
  const refreshUsers = useCallback(async () => { 
    setUsersLoading(true)
    
    try {
      // Try the new admin function first, fall back to simple function if not available
      let data, error
      
      const adminResult = await supabase.rpc('get_users_for_admin')
      
      // Check if the function doesn't exist (404 or PGRST202 error)
      if (adminResult.error && (
          adminResult.error.code === 'PGRST202' || 
          adminResult.error.message.includes('Could not find the function')
        )) {
        const fallbackResult = await supabase.rpc('get_users_simple')
        
        // If get_users_simple also fails (url_encode error), fall back to direct table query
        if ((fallbackResult.error && fallbackResult.error.message.includes('url_encode')) ||
            (fallbackResult.data && fallbackResult.data.error && fallbackResult.data.error.includes('url_encode'))) {
          console.log('get_users_simple has url_encode error, falling back to direct table query...')
          
          // Direct table query as final fallback
          const { data: usersData, error: tableError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (tableError) {
            console.error('Direct table query error:', tableError)
            throw tableError
          }
          
          // Transform table data to match expected format
          data = {
            success: true,
            users: usersData.map(user => ({
              id: user.id,
              name: user.name,
              email: user.email,
              username: user.username,
              role: user.role,
              employeeNumber: user.employee_number,
              position: user.position,
              avatar: user.avatar,
              createdAt: user.created_at,
              password: '' // Don't expose password
            })),
            count: usersData.length
          }
          error = null
          
          console.log('✅ Direct table query successful, found', usersData.length, 'users')
        } else {
          data = fallbackResult.data
          error = fallbackResult.error
        }
      } else {
        // Use admin function result
        data = adminResult.data
        error = adminResult.error
      }
      
      if (error) {
        console.error('Error fetching users from database:', error)
        throw error
      }
      
      if (data && data.success && data.users) {
        console.log('✅ Users fetched successfully from database:', data.users.length)
        
        // Log sample users for debugging
        if (data.users.length > 0) {
          console.log('👥 Sample users from database:')
          data.users.slice(0, 3).forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`)
          })
        }
        
        // Update state with users
        setUsers(data.users)
        
        // Sync with session storage
        setSessionData('users', JSON.stringify(data.users))
        setSessionData('lastUserSync', new Date().toISOString())
        
        console.log('✅ Users state and session storage updated successfully')
        
        // Log user summary
        const roleCount = data.users.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        }, {})
        
        console.log(`👥 User sync summary:
          - Total users: ${data.users.length}
          - Role distribution: ${Object.entries(roleCount).map(([role, count]) => `${role}: ${count}`).join(', ')}
          - Database sync: ✅ Complete`)
      } else {
        console.warn('⚠️ No users returned or error occurred:', data?.error || 'Unknown error')
        
        // Check if this is a url_encode error that we can fix with direct table query
        if (data?.error && data.error.includes('url_encode')) {
          console.log('🔧 Detected url_encode error in response, trying direct table query...')
          
          try {
            // Direct table query as emergency fallback
            const { data: usersData, error: tableError } = await supabase
              .from('users')
              .select('*')
              .order('created_at', { ascending: false })
            
            if (!tableError && usersData && usersData.length > 0) {
              // Transform table data to match expected format
              const transformedUsers = usersData.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role,
                employeeNumber: user.employee_number,
                position: user.position,
                avatar: user.avatar,
                createdAt: user.created_at,
                password: '' // Don't expose password
              }))
              
              console.log('✅ Emergency direct table query successful, found', usersData.length, 'users')
              
              // Update state with users
              setUsers(transformedUsers)
              
              // Sync with session storage
              setSessionData('users', JSON.stringify(transformedUsers))
              setSessionData('lastUserSync', new Date().toISOString())
              
              console.log('✅ Users state and session storage updated via emergency fallback')
              return // Exit successfully
            }
          } catch (emergencyError) {
            console.error('❌ Emergency table query also failed:', emergencyError)
          }
        }
        
        // Try to load from sessionStorage as fallback
        const cachedUsers = getSessionData('users')
        if (cachedUsers) {
          console.log('📱 Loading users from session storage as fallback')
          const parsedUsers = JSON.parse(cachedUsers)
          setUsers(parsedUsers)
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch users from database:', error)
      
      // Try to load from sessionStorage as fallback
      const cachedUsers = getSessionData('users')
      if (cachedUsers) {
        console.log('📱 Loading users from session storage as fallback')
        const parsedUsers = JSON.parse(cachedUsers)
        setUsers(parsedUsers)
      } else {
        // If no cached data available, show error
        toast({
          title: "Error loading users",
          description: "Failed to load users from database. Please try refreshing the page.",
          variant: "destructive"
        })
      }
    } finally {
      setUsersLoading(false)
    }
  }, [])
  
  const refreshContacts = useCallback(async () => { 
    console.log('🔄 refreshContacts called')
    if (!currentUser) {
      console.log('No current user, skipping contact refresh')
      return
    }
    
    if (!superAdminService) {
      console.log('No Supabase service, loading from session storage')
      const storedContacts = getSessionData('contacts')
      if (storedContacts) {
        try {
          const parsedContacts = JSON.parse(storedContacts)
          setContacts(parsedContacts)
          console.log('Loaded contacts from session storage:', parsedContacts.length)
        } catch (error) {
          console.error('Error parsing session storage contacts:', error)
          setContacts([])
        }
      }
      return
    }
    
    try {
      setContactsLoading(true)
      console.log('📡 Fetching latest contacts from database for user:', currentUser.id, currentUser.role)
      console.log('🔐 User details:', { id: currentUser.id, role: currentUser.role, email: currentUser.email || 'no-email' })
      
      // All users now fetch all contacts (collaborative view)
      // This ensures everyone sees the same collaborative contacts
      const userId = undefined // Fetch all contacts for all user types
      console.log('🔍 Using userId filter:', userId, '(undefined means fetch all contacts - collaborative view for ALL users including SUPERADMIN)')
      
      const result = await superAdminService.getContacts(userId)
      console.log('📥 Database response:', { success: result?.success, contactCount: result?.contacts?.length, error: result?.error })
      
      if (result && result.success && result.contacts) {
        console.log('✅ Contacts fetched successfully from database:', result.contacts.length)
        
        // Log sample contacts for debugging
        if (result.contacts.length > 0) {
          console.log('📋 Sample contacts from database:')
          result.contacts.slice(0, 3).forEach((contact, index) => {
            console.log(`  ${index + 1}. ${contact.firstName} ${contact.lastName} (Created by: ${contact.ownerName}, ID: ${contact.ownerId})`)
          })
        }
        
        // Ensure data integrity - validate contact structure
        const validContacts = result.contacts.filter(contact => {
          const isValid = contact.id && contact.firstName && contact.ownerId && contact.ownerName
          if (!isValid) {
            console.warn('Invalid contact structure detected:', contact)
          }
          return isValid
        })
        
        console.log('Valid contacts after filtering:', validContacts.length)
        
        // Update state with validated contacts
        setContacts(validContacts)
        
        // Sync with session storage immediately
        setSessionData('contacts', JSON.stringify(validContacts))
        setSessionData('lastContactSync', new Date().toISOString())
        
        console.log('✅ Contacts state and session storage updated successfully')
        
        // Log detailed sync information for debugging
        if (validContacts.length > 0) {
          const personalCount = validContacts.filter(c => c.ownerId === currentUser.id).length
          const collaborativeCount = validContacts.length - personalCount
          const uniqueOwners = [...new Set(validContacts.map(c => c.ownerName))]
          
          console.log(`📊 Contact sync summary:
            - Total contacts: ${validContacts.length}
            - Personal contacts (${currentUser.name}): ${personalCount}
            - Collaborative contacts: ${collaborativeCount}
            - Unique owners: ${uniqueOwners.join(', ')}
            - Database sync: ✅ Complete`)
        } else {
          console.log('📭 No contacts found in database')
        }
      } else {
        console.warn('⚠️ No contacts returned or error occurred:', result?.error || 'Unknown error')
        
        // Try to load from localStorage as fallback
        const storedContacts = localStorage.getItem('contacts')
        if (storedContacts) {
          try {
            const parsedContacts = JSON.parse(storedContacts)
            setContacts(parsedContacts)
            console.log('📦 Fallback: Loaded contacts from localStorage:', parsedContacts.length)
          } catch (error) {
            console.error('Error parsing fallback contacts:', error)
            setContacts([])
          }
        } else {
          console.log('No fallback contacts available')
          setContacts([])
        }
      }
    } catch (error) {
      console.error('❌ Error fetching contacts from database:', error)
      
      // Fallback to localStorage
      const storedContacts = localStorage.getItem('contacts')
      if (storedContacts) {
        try {
          const parsedContacts = JSON.parse(storedContacts)
          setContacts(parsedContacts)
          console.log('📦 Error fallback: Loaded contacts from localStorage:', parsedContacts.length)
        } catch (parseError) {
          console.error('Error parsing fallback contacts:', parseError)
          setContacts([])
        }
      } else {
        console.log('No fallback data available')
        setContacts([])
      }
    } finally {
      setContactsLoading(false)
    }
  }, [currentUser])

  // Test Supabase connection on mount and set up real-time subscriptions
  useEffect(() => {
    const testConnection = async () => {
      const isConnected = await testSupabaseConnection()
      if (isConnected) {
        console.log('✅ Supabase database connection is working')
      } else {
        console.error('❌ Supabase database connection failed')
      }
    }
    testConnection()
    
    // Set up real-time subscription for contacts
    let contactsSubscription: ReturnType<typeof supabase.channel> | null = null
    
    if (currentUser && superAdminService) {
      console.log('Setting up real-time contact subscription for user:', currentUser.name)
      
      // Subscribe to changes in the contacts table
      contactsSubscription = supabase
        .channel('contacts-realtime')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'contacts'
          },
          async (payload) => {
            console.log('🔄 Real-time contact change detected:', payload)
            
            // Refresh contacts to get the latest data with enhanced error handling
            try {
              const userId = currentUser.role === 'user' ? currentUser.id : undefined
              const result = await superAdminService.getContacts(userId)
              
              if (result && result.success && result.contacts) {
                console.log('📡 Real-time sync - contacts updated:', result.contacts.length)
                
                // Validate data integrity before updating state
                const validContacts = result.contacts.filter(contact => {
                  const isValid = contact.id && contact.firstName && contact.ownerId && contact.ownerName
                  if (!isValid) {
                    console.warn('Invalid contact detected in real-time sync:', contact)
                  }
                  return isValid
                })
                
                console.log(`📊 Real-time sync validation:
                  - Total received: ${result.contacts.length}
                  - Valid contacts: ${validContacts.length}
                  - Invalid filtered: ${result.contacts.length - validContacts.length}`)
                
                setContacts(validContacts)
                localStorage.setItem('contacts', JSON.stringify(validContacts))
                localStorage.setItem('lastRealtimeSync', new Date().toISOString())
                
                // Log the real-time update with enhanced details
                const eventType = payload.eventType
                const contactData = payload.new || payload.old
                const contactName = contactData && typeof contactData === 'object' && 'first_name' in contactData && 'last_name' in contactData
                  ? `${(contactData as DatabaseContact).first_name} ${(contactData as DatabaseContact).last_name}` 
                  : 'Unknown'
                
                console.log(`📡 Real-time: Contact ${contactName} was ${eventType.toLowerCase()}d by another user`)
                
                // Show toast notification for real-time updates
                const eventActions = {
                  INSERT: 'created',
                  UPDATE: 'updated', 
                  DELETE: 'deleted'
                }
                const actionText = eventActions[eventType as keyof typeof eventActions] || eventType.toLowerCase()
                
                toast({
                  title: "📡 Real-time Update",
                  description: `Contact "${contactName}" was ${actionText} by another user`,
                  duration: 3000,
                })
                
                console.log('✅ Real-time contact sync completed successfully')
              } else {
                console.warn('⚠️ Real-time sync failed - invalid response:', result)
                
                // If sync fails, try force refresh after a delay
                setTimeout(async () => {
                  console.log('🔄 Attempting force refresh due to real-time sync failure...')
                  await refreshContacts()
                }, 2000)
              }
            } catch (error) {
              console.error('❌ Error in real-time contact sync:', error)
              
              // Try to refresh contacts as fallback
              setTimeout(async () => {
                console.log('🔄 Attempting backup contact refresh due to real-time error...')
                await refreshContacts()
              }, 5000)
            }
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status)
        })
    }
    
    // Set up periodic sync every 5 minutes as backup
    const syncInterval = setInterval(async () => {
      if (currentUser && superAdminService) {
        console.log('Running periodic contact sync...')
        try {
          // Get latest contacts from database
          const userId = currentUser.role === 'user' ? currentUser.id : undefined
          const result = await superAdminService.getContacts(userId)
          
          if (result && result.success && result.contacts) {
            console.log('Periodic sync - contacts fetched:', result.contacts.length)
            setContacts(result.contacts)
            localStorage.setItem('contacts', JSON.stringify(result.contacts))
          }
        } catch (error) {
          console.warn('Periodic sync failed:', error)
        }
      }
    }, 5 * 60 * 1000) // 5 minutes
    
    // Cleanup on unmount
    return () => {
      clearInterval(syncInterval)
      if (contactsSubscription) {
        console.log('Cleaning up real-time subscription')
        contactsSubscription.unsubscribe()
      }
    }
  }, [currentUser, refreshContacts])

  // Restore user session from sessionStorage on mount (expires when browser closes)
  useEffect(() => {
    try {
      console.log('🔄 Initializing app and checking for active session...')
      const savedUser = sessionStorage.getItem('currentUser')
      if (savedUser) {
        const user = JSON.parse(savedUser)
        console.log('✅ Restoring active session for user:', user.name)
        setCurrentUser(user)
      } else {
        console.log('📭 No active session found - user needs to login')
        // Clear any old localStorage data for security
        localStorage.removeItem('currentUser')
        localStorage.removeItem('lastLoginTime')
        localStorage.removeItem('loginMethod')
      }
    } catch (error) {
      console.warn('⚠️ Failed to restore session:', error)
      // Clear invalid session data
      sessionStorage.removeItem('currentUser')
      localStorage.removeItem('currentUser')
    } finally {
      // Mark initialization as complete after a brief delay to ensure UI is stable
      setTimeout(() => {
        setIsInitializing(false)
        console.log('✅ App initialization complete')
      }, 100)
    }
  }, [])

  // Load users and contacts from Supabase on initialization and handle pending syncs
  useEffect(() => {
    const loadDataFromSupabase = async () => {
      if (currentUser) {
        // Check for pending contact syncs first
        try {
          const pendingSync = localStorage.getItem('pendingContactSync')
          if (pendingSync) {
            console.log('Found pending contact sync operations:', pendingSync)
            const pendingOperations = JSON.parse(pendingSync)
            
            // Try to sync pending operations
            for (const operation of pendingOperations) {
              if (operation.action === 'create' && operation.contact) {
                try {
                  console.log('Retrying contact creation:', operation.contact.firstName, operation.contact.lastName)
                  const result = await superAdminService.createContact({
                    firstName: operation.contact.firstName,
                    middleName: operation.contact.middleName,
                    lastName: operation.contact.lastName,
                    birthday: operation.contact.birthday,
                    contactNumber: operation.contact.contactNumber,
                    company: operation.contact.company,
                    userId: operation.contact.ownerId
                  })
                  
                  if (result && result.success) {
                    console.log('Successfully synced pending contact:', result.contact_id)
                    // Update the contact with the real database ID in localStorage
                    const storedContacts = localStorage.getItem('contacts')
                    if (storedContacts) {
                      const contacts = JSON.parse(storedContacts)
                      const updatedContacts = contacts.map(c => 
                        c.id === operation.contact.id ? { ...c, id: result.contact_id } : c
                      )
                      localStorage.setItem('contacts', JSON.stringify(updatedContacts))
                    }
                  }
                } catch (error) {
                  console.warn('Failed to sync pending contact, will retry later:', error)
                }
              }
            }
            
            // Clear pending sync after attempting all operations
            localStorage.removeItem('pendingContactSync')
          }
        } catch (error) {
          console.warn('Error processing pending sync operations:', error)
        }
        
        // Load users for admin/superadmin using the new refreshUsers function
        if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
          console.log('Loading users from database using refreshUsers...')
          await refreshUsers()
        }
        
        // Load contacts for all users
        try {
          console.log('Loading contacts from Supabase...')
          console.log('Current user role:', currentUser.role)
          console.log('Current user ID:', currentUser.id)
          
          // All users should see all contacts (collaborative view)
          // This ensures everyone sees the same collaborative contacts
          const userId = undefined // Always fetch all contacts for collaborative viewing
          console.log('Fetching contacts with userId filter:', userId, '(undefined = collaborative view for all users including superadmin)')
          
          const contactsResult = await superAdminService.getContacts(userId)
          console.log('Raw Supabase contacts result:', contactsResult)
          
          if (contactsResult && contactsResult.success && contactsResult.contacts) {
            console.log('Loaded contacts from Supabase:', contactsResult.contacts.length)
            console.log('Sample contact data:', contactsResult.contacts[0])
            
            // Verify the data structure is correct
            if (Array.isArray(contactsResult.contacts) && contactsResult.contacts.length > 0) {
              const sampleContact = contactsResult.contacts[0]
              console.log('Contact structure verification:', {
                hasId: !!sampleContact.id,
                hasFirstName: !!sampleContact.firstName,
                hasLastName: !!sampleContact.lastName,
                hasOwnerId: !!sampleContact.ownerId,
                hasOwnerName: !!sampleContact.ownerName,
                sampleOwnerId: sampleContact.ownerId,
                currentUserId: currentUser.id,
                isPersonalContact: sampleContact.ownerId === currentUser.id
              })
            }
            
            setContacts(contactsResult.contacts)
            
            // Also store in localStorage as backup
            localStorage.setItem('contacts', JSON.stringify(contactsResult.contacts))
            console.log('Contacts saved to localStorage and state updated')
          } else {
            console.log('No contacts returned or error occurred:', contactsResult)
            console.log('Loading from localStorage as fallback...')
            const storedContacts = localStorage.getItem('contacts')
            if (storedContacts) {
              const parsedContacts = JSON.parse(storedContacts)
              console.log('Loaded contacts from localStorage:', parsedContacts.length)
              setContacts(parsedContacts)
            } else {
              console.log('No contacts in localStorage either')
              setContacts([])
            }
          }
        } catch (error) {
          console.warn('Failed to load contacts from Supabase, using localStorage:', error)
          // Fallback to localStorage
          const storedContacts = localStorage.getItem('contacts')
          if (storedContacts) {
            const parsedContacts = JSON.parse(storedContacts)
            console.log('Fallback: Loaded contacts from localStorage:', parsedContacts.length)
            setContacts(parsedContacts)
          } else {
            console.log('Fallback: No contacts available anywhere')
            setContacts([])
          }
        }

        // Load changelog from database (for admin and superadmin users)
        // Note: loadChangelogFromDatabase will be called in a separate useEffect
        // to avoid initialization order issues
        if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
          console.log('Admin/superadmin user detected - changelog will be loaded separately')
        } else {
          console.log('Regular user - changelog not loaded')
        }
      }
    }

    // Load data when component mounts or user changes
    loadDataFromSupabase()
  }, [currentUser, refreshUsers]) // Removed loadChangelogFromDatabase to fix initialization error

  const syncContactsToDatabase = async () => {
    if (!currentUser || !superAdminService) {
      console.log('Cannot sync - no user or Supabase service unavailable')
      return
    }
    
    console.log('Manual contact sync triggered...')
    try {
      // Get latest contacts from database
      const userId = currentUser.role === 'user' ? currentUser.id : undefined
      const result = await superAdminService.getContacts(userId)
      
      if (result && result.success && result.contacts) {
        console.log('Manual sync successful - contacts:', result.contacts.length)
        setContacts(result.contacts)
        localStorage.setItem('contacts', JSON.stringify(result.contacts))
        
        // Check for any pending sync operations and clear them if data matches
        const pendingSync = localStorage.getItem('pendingContactSync')
        if (pendingSync) {
          console.log('Clearing resolved pending sync operations')
          localStorage.removeItem('pendingContactSync')
        }
      } else {
        console.warn('Manual sync failed:', result?.error)
      }
    } catch (error) {
      console.error('Manual sync error:', error)
    }
  }
  
  const refreshChangelog = async () => { 
    console.log('refreshChangelog called - loading from database')
    await loadChangelogFromDatabase()
  }
  
  const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const newUser = { ...userData, id: Date.now().toString() }
    setUsers(prev => [...prev, newUser])
    return newUser
  }
  
  const updateUser = async (id: string, userData: Partial<Omit<User, 'id'>>): Promise<User> => {
    console.log('Updating user via SuperAdmin:', id, userData)
    
    // Check if current user is superadmin or admin
    if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'admin')) {
      throw new Error('Only SuperAdmin or Admin can update users')
    }

    try {
      // If Supabase service is available, try to update in database first
      if (superAdminService) {
        console.log('Updating user in Supabase database:', id)
        
        const result = await superAdminService.updateUser(id, {
          email: userData.email,
          name: userData.name,
          username: userData.username,
          employee_number: userData.employeeNumber,
          position: userData.position,
          role: userData.role
        })

        console.log('Supabase updateUser result:', result)

        if (result && result.success) {
          console.log('User successfully updated in Supabase database')
        } else {
          console.warn('Supabase update returned success=false, continuing with local update')
        }
      }
    } catch (error) {
      console.error('Error updating user in Supabase:', error)
      // Continue with local update even if Supabase fails
    }

    // Update local state regardless of Supabase result
    const updatedUser = { ...users.find(u => u.id === id)!, ...userData }
    setUsers(prev => prev.map(u => u.id === id ? updatedUser : u))
    
    return updatedUser
  }
  
  const deleteUser = async (id: string): Promise<void> => {
    setUsers(prev => prev.filter(u => u.id !== id))
  }
  
  const login = async (email: string, password: string): Promise<User | null> => {
    console.log('Login attempt:', email)
    
    // First, try to authenticate against the database users
    if (superAdminService) {
      try {
        console.log('Attempting database authentication...')
        const authResult = await superAdminService.authenticateUser(email, password)
        
        if (authResult && authResult.success && authResult.user) {
          console.log('Database authentication successful for:', authResult.user.name)
          
          // Convert database user to app user format
          const authenticatedUser: User = {
            id: authResult.user.id,
            name: authResult.user.name,
            email: authResult.user.email,
            username: authResult.user.username,
            password: '', // Never store password in frontend
            role: authResult.user.role as UserRole,
            position: authResult.user.position,
            employeeNumber: authResult.user.employee_number,
            avatar: authResult.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authResult.user.name)}&background=3b82f6&color=fff`
          }
          
          setCurrentUser(authenticatedUser)
          // Store session in sessionStorage (expires when browser closes)
          sessionStorage.setItem('currentUser', JSON.stringify(authenticatedUser))
          sessionStorage.setItem('lastLoginTime', new Date().toISOString())
          sessionStorage.setItem('loginMethod', 'database')
          
          // Also store login info for audit purposes (persistent)
          localStorage.setItem('lastSuccessfulLogin', new Date().toISOString())
          localStorage.setItem('lastLoginUser', authenticatedUser.email)
          
          console.log('✅ Database user session saved to sessionStorage (expires on browser close)')
          await logAction('login', 'system', `User ${authenticatedUser.name} logged in from database`, authenticatedUser.id, authenticatedUser.name)
          
          // Trigger contact refresh after successful login
          setTimeout(async () => {
            console.log('🔄 Refreshing contacts after successful database login...')
            await refreshContacts()
          }, 500)
          
          return authenticatedUser
        } else {
          console.log('Database authentication failed:', authResult?.error || 'Invalid credentials')
          
          // Debug the user to see if they exist
          try {
            const debugResult = await superAdminService.debugUserAuth(email)
            console.log('Debug user info:', debugResult)
            
            if (debugResult && debugResult.found) {
              console.log('User exists in database but password verification failed')
              console.log('User details:', {
                email: debugResult.email,
                name: debugResult.name,
                role: debugResult.role,
                hasPasswordHash: debugResult.has_password_hash,
                passwordHashLength: debugResult.password_hash_length
              })
            } else {
              console.log('User not found in database')
            }
          } catch (debugError) {
            console.warn('Debug failed:', debugError)
          }
        }
      } catch (error) {
        console.warn('Database authentication error, falling back to default users:', error)
      }
    } else {
      console.warn('Supabase service not available, using default users only')
    }
    
    // Fallback to default users for testing/development
    console.log('Trying default users fallback...')
    const defaultUsers = [
      {
        email: 'superadmin@company.com',
        password: 'SuperAdmin123!',
        user: {
          id: '1',
          name: 'Super Administrator',
          email: 'superadmin@company.com',
          username: 'superadmin',
          password: '',
          role: 'superadmin' as UserRole,
          position: 'System Administrator',
          employeeNumber: 'SA001',
          avatar: 'https://ui-avatars.com/api/?name=Super+Administrator&background=dc2626&color=fff'
        }
      },
      {
        email: 'admin@company.com',
        password: 'Admin123!',
        user: {
          id: '2',
          name: 'Administrator',
          email: 'admin@company.com',
          username: 'admin',
          password: '',
          role: 'admin' as UserRole,
          position: 'Administrator',
          employeeNumber: 'ADM001',
          avatar: 'https://ui-avatars.com/api/?name=Administrator&background=3b82f6&color=fff'
        }
      },
      {
        email: 'user@company.com',
        password: 'User123!',
        user: {
          id: '3',
          name: 'Regular User',
          email: 'user@company.com',
          username: 'user',
          password: '',
          role: 'user' as UserRole,
          position: 'Employee',
          employeeNumber: 'EMP001',
          avatar: 'https://ui-avatars.com/api/?name=Regular+User&background=10b981&color=fff'
        }
      }
    ]

    // Check credentials against default users
    const matchedUser = defaultUsers.find(u => u.email === email && u.password === password)
    
    if (matchedUser) {
      console.log('Default user login successful for:', matchedUser.user.name)
      setCurrentUser(matchedUser.user)
      // Store session in sessionStorage (expires when browser closes)
      sessionStorage.setItem('currentUser', JSON.stringify(matchedUser.user))
      sessionStorage.setItem('lastLoginTime', new Date().toISOString())
      sessionStorage.setItem('loginMethod', 'default')
      
      // Also store login info for audit purposes (persistent)
      localStorage.setItem('lastSuccessfulLogin', new Date().toISOString())
      localStorage.setItem('lastLoginUser', matchedUser.user.email)
      
      console.log('✅ Default user session saved to sessionStorage (expires on browser close)')
      await logAction('login', 'system', `User ${matchedUser.user.name} logged in (default)`, matchedUser.user.id, matchedUser.user.name)
      
      // Trigger contact refresh after successful default login
      setTimeout(async () => {
        console.log('🔄 Refreshing contacts after successful default login...')
        await refreshContacts()
      }, 500)
      
      return matchedUser.user
    }

    console.log('Login failed for:', email)
    return null
  }
  
  const logout = useCallback(async () => {
    console.log('🚪 Logout called - clearing user session')
    
    // Store user info for logging after logout
    if (currentUser) {
      sessionStorage.setItem('pendingLogoutLog', JSON.stringify({
        id: currentUser.id,
        name: currentUser.name
      }))
    }
    
    setCurrentUser(null)
    
    // Clear session data (sessionStorage expires on browser close anyway)
    sessionStorage.removeItem('currentUser')
    sessionStorage.removeItem('lastLoginTime')
    sessionStorage.removeItem('loginMethod')
    
    // Clear temporary app data
    sessionStorage.removeItem('contacts')
    sessionStorage.removeItem('users')
    sessionStorage.removeItem('changelog')
    
    // Keep audit trail but clear old persistent data
    localStorage.removeItem('currentUser') // Remove any old persistent sessions
    localStorage.removeItem('wasLoggedIn')
    localStorage.removeItem('contacts')
    localStorage.removeItem('users')
    localStorage.removeItem('changelog')
    localStorage.removeItem('lastContactSync')
    localStorage.removeItem('lastRealtimeSync')
    localStorage.removeItem('pendingContactSync')
    
    // Clear component states
    setContacts([])
    setUsers([])
    setChangelog([])
    
    console.log('✅ User session cleared - will require login on next browser session')
    
    // Show logout confirmation
    setTimeout(() => {
      console.log('🔄 User has been logged out successfully')
    }, 100)
  }, [currentUser]) // Removed logAction to fix initialization order issue
  
  const createContact = async (contactData: Omit<Contact, 'id' | 'ownerId' | 'ownerName' | 'createdAt'>): Promise<Contact> => {
    if (!currentUser) throw new Error('No current user')
    
    console.log('Creating contact:', contactData)
    
    // Create the contact object for immediate local state update
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newContact: Contact = {
      ...contactData,
      id: tempId,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      createdAt: new Date().toISOString()
    }
    
    // Immediately update local state for better UX
    setContacts(prev => [...prev, newContact])
    
    // Immediately save to localStorage as backup
    const tempContacts = [...contacts, newContact]
    localStorage.setItem('contacts', JSON.stringify(tempContacts))
    localStorage.setItem('pendingContactSync', JSON.stringify([{ action: 'create', contact: newContact }]))
    
    // Try to save to database
    if (superAdminService) {
      try {
        const result = await superAdminService.createContact({
          firstName: contactData.firstName,
          middleName: contactData.middleName,
          lastName: contactData.lastName,
          birthday: contactData.birthday,
          contactNumber: contactData.contactNumber,
          company: contactData.company,
          userId: currentUser.id
        })
        
        if (result && result.success) {
          console.log('Contact created successfully in database:', result)
          
          // Update the contact with the real database ID
          const finalContact: Contact = {
            ...newContact,
            id: result.contact_id
          }
          
          // Update local state with real ID
          setContacts(prev => prev.map(c => c.id === tempId ? finalContact : c))
          
          // Update localStorage with real data
          const finalContacts = tempContacts.map(c => c.id === tempId ? finalContact : c)
          localStorage.setItem('contacts', JSON.stringify(finalContacts))
          
          // Clear pending sync since we succeeded
          localStorage.removeItem('pendingContactSync')
          
          // Log the action with enhanced details
          await logAction('create', 'contact', `Contact ${contactData.firstName} ${contactData.lastName} created successfully in database`, result.contact_id, `${contactData.firstName} ${contactData.lastName}`, 
            `Database ID: ${result.contact_id}, User: ${currentUser.name}, Company: ${contactData.company}`)
          
          // Broadcast real-time update to other users
          try {
            await supabase.rpc('log_changelog', {
              p_user_id: currentUser.id,
              p_action: 'create',
              p_entity: 'contact',
              p_entity_id: result.contact_id,
              p_entity_name: `${contactData.firstName} ${contactData.lastName}`,
              p_description: `Contact ${contactData.firstName} ${contactData.lastName} created by ${currentUser.name}`,
              p_details: `Company: ${contactData.company}, Real-time sync: enabled`
            })
            console.log('📡 Real-time update broadcasted for contact creation')
          } catch (broadcastError) {
            console.warn('Failed to broadcast real-time update:', broadcastError)
          }
          
          // Force refresh contacts to ensure all views are updated
          setTimeout(async () => {
            console.log('🔄 Force refreshing contacts after creation...')
            await refreshContacts()
          }, 1000)
          
          console.log('✅ Contact successfully created and synced with database:', {
            tempId,
            databaseId: result.contact_id,
            name: `${contactData.firstName} ${contactData.lastName}`,
            owner: currentUser.name
          })
          
          return finalContact
        } else {
          console.error('❌ Database contact creation failed:', result?.error || 'Unknown error')
          console.log('📝 Contact data that failed:', contactData)
          
          // Log the failure for debugging
          await logAction('create', 'contact', `Contact ${contactData.firstName} ${contactData.lastName} creation failed in database`, tempId, `${contactData.firstName} ${contactData.lastName}`, 
            `Error: ${result?.error || 'Unknown error'}, Data: ${JSON.stringify(contactData)}`)
          
          // Keep the temporary contact in local state for manual retry later
          return newContact
        }
      } catch (error) {
        console.error('Error creating contact in database:', error)
        // Contact remains in local state with temp ID for retry later
        return newContact
      }
    } else {
      // Fallback to local storage only
      console.log('No Supabase service, contact saved locally only')
      return newContact
    }
  }
  
  const updateContact = async (id: string, contactData: Partial<Omit<Contact, 'id'>>): Promise<Contact> => {
    console.log('🔄 Updating contact:', id, contactData)
    
    if (!currentUser) throw new Error('No current user')
    
    // Find the existing contact to ensure we have all data
    const existingContact = contacts.find(c => c.id === id)
    if (!existingContact) {
      throw new Error(`Contact with ID ${id} not found`)
    }
    
    // Create the updated contact object
    const updatedContact: Contact = { 
      ...existingContact, 
      ...contactData,
      // Ensure these fields don't get overwritten accidentally
      id: existingContact.id,
      ownerId: existingContact.ownerId,
      ownerName: existingContact.ownerName,
      createdAt: existingContact.createdAt
    }
    
    console.log('📝 Contact update details:', {
      id,
      originalName: `${existingContact.firstName} ${existingContact.lastName}`,
      updatedName: `${updatedContact.firstName} ${updatedContact.lastName}`,
      changes: JSON.stringify(contactData)
    })
    
    // Immediately update local state for better UX
    setContacts(prev => prev.map(c => c.id === id ? updatedContact : c))
    
    // Immediately save to localStorage as backup
    const updatedContacts = contacts.map(c => c.id === id ? updatedContact : c)
    localStorage.setItem('contacts', JSON.stringify(updatedContacts))
    localStorage.setItem('lastContactSync', new Date().toISOString())
    
    // If we have Supabase service, update in database
    if (superAdminService) {
      try {
        console.log('📡 Syncing contact update to database...')
        const result = await superAdminService.updateContact(id, {
          firstName: contactData.firstName,
          middleName: contactData.middleName,
          lastName: contactData.lastName,
          birthday: contactData.birthday,
          contactNumber: contactData.contactNumber,
          company: contactData.company
        })
        
        if (result && result.success) {
          console.log('✅ Contact updated successfully in database:', result)
          
          // Log the action with enhanced details
          await logAction('update', 'contact', 
            `Contact ${updatedContact.firstName} ${updatedContact.lastName} updated successfully`, 
            id, 
            `${updatedContact.firstName} ${updatedContact.lastName}`,
            `Updated by: ${currentUser.name}, Changes: ${JSON.stringify(contactData)}, Database sync: ✅`
          )
          
          // Broadcast real-time update to other users
          try {
            await supabase.rpc('log_changelog', {
              p_user_id: currentUser.id,
              p_action: 'update',
              p_entity: 'contact',
              p_entity_id: id,
              p_entity_name: `${updatedContact.firstName} ${updatedContact.lastName}`,
              p_description: `Contact ${updatedContact.firstName} ${updatedContact.lastName} updated by ${currentUser.name}`,
              p_details: `Changes: ${JSON.stringify(contactData)}, Real-time sync: enabled`
            })
            console.log('📡 Real-time update broadcasted for contact update')
          } catch (broadcastError) {
            console.warn('Failed to broadcast real-time update:', broadcastError)
          }
          
          console.log('✅ Contact update complete:', {
            id,
            name: `${updatedContact.firstName} ${updatedContact.lastName}`,
            updatedBy: currentUser.name,
            databaseSync: 'success'
          })
          
          return updatedContact
        } else {
          console.error('❌ Database contact update failed:', result?.error || 'Unknown error')
          
          // Log the failure
          await logAction('update', 'contact', 
            `Contact ${updatedContact.firstName} ${updatedContact.lastName} update failed in database`, 
            id, 
            `${updatedContact.firstName} ${updatedContact.lastName}`,
            `Error: ${result?.error || 'Unknown error'}, Local state updated, database sync failed`
          )
          
          // Return the updated contact (local state is already updated)
          return updatedContact
        }
      } catch (error) {
        console.error('❌ Error updating contact in database:', error)
        
        // Log the error
        await logAction('update', 'contact', 
          `Contact ${updatedContact.firstName} ${updatedContact.lastName} update error`, 
          id, 
          `${updatedContact.firstName} ${updatedContact.lastName}`,
          `Error: ${error}, Local state updated, database sync failed`
        )
        
        // Contact update remains in local state
        return updatedContact
      }
    } else {
      // Fallback to local storage only
      console.log('📦 No Supabase service, contact updated locally only')
      return updatedContact
    }
  }
  
  const deleteContact = async (id: string): Promise<void> => {
    console.log('Deleting contact:', id)
    
    // Get contact info for logging before deletion
    const contactToDelete = contacts.find(c => c.id === id)
    const contactName = contactToDelete ? `${contactToDelete.firstName} ${contactToDelete.lastName}` : 'Unknown Contact'
    
    // Immediately update local state for better UX
    setContacts(prev => prev.filter(c => c.id !== id))
    
    // Immediately update localStorage as backup
    const updatedContacts = contacts.filter(c => c.id !== id)
    localStorage.setItem('contacts', JSON.stringify(updatedContacts))
    
    // If we have Supabase service, delete from database
    if (superAdminService) {
      try {
        const result = await superAdminService.deleteContact(id)
        
        if (result && result.success) {
          console.log('Contact deleted successfully from database:', result)
          
          // Log the action
          await logAction('delete', 'contact', `Contact ${contactName} deleted`, id, contactName)
          
          // Broadcast real-time update to other users
          try {
            await supabase.rpc('log_changelog', {
              p_user_id: currentUser!.id,
              p_action: 'delete',
              p_entity: 'contact',
              p_entity_id: id,
              p_entity_name: contactName,
              p_description: `Contact ${contactName} deleted by ${currentUser!.name}`,
              p_details: `Real-time sync: enabled`
            })
            console.log('📡 Real-time update broadcasted for contact deletion')
          } catch (broadcastError) {
            console.warn('Failed to broadcast real-time update:', broadcastError)
          }
        } else {
          console.error('Database contact deletion failed:', result?.error || 'Unknown error')
          // Contact remains deleted from local state
        }
      } catch (error) {
        console.error('Error deleting contact from database:', error)
        // Contact remains deleted from local state
      }
    } else {
      // Fallback to local storage only
      console.log('No Supabase service, contact deleted locally only')
    }
  }
  
  // Load changelog from database
  const loadChangelogFromDatabase = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.rpc('get_changelog', {
        p_limit: 100,
        p_offset: 0
      })
      
      if (error) {
        console.error('❌ Failed to load changelog from database:', error)
        return
      }
      
      if (data && data.success && data.changelog) {
        // The new get_changelog function returns a structured response
        const transformedChangelog: ChangelogEntry[] = data.changelog.map((entry: {
          id: string,
          timestamp: string,
          userId: string,
          userName: string,
          userRole: string,
          action: string,
          entity: string,
          entityId: string | null,
          entityName: string | null,
          description: string,
          details: string | null
        }) => ({
          id: entry.id,
          timestamp: entry.timestamp,
          userId: entry.userId,
          userName: entry.userName,
          userRole: entry.userRole as UserRole,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          entityName: entry.entityName,
          description: entry.description,
          details: entry.details
        }))
        
        setChangelog(transformedChangelog)
        console.log('✅ Loaded changelog from database:', transformedChangelog.length, 'entries')
      } else {
        console.warn('⚠️ No changelog data returned or error occurred:', data?.error || 'Unknown error')
        // Set empty changelog if no data
        setChangelog([])
      }
    } catch (error) {
      console.error('❌ Error loading changelog from database:', error)
      // Set empty changelog on error
      setChangelog([])
    }
  }, [])
  
  const logAction = useCallback(async (
    action: ChangelogEntry['action'],
    entity: ChangelogEntry['entity'],
    description: string,
    entityId?: string,
    entityName?: string,
    details?: string
  ): Promise<void> => {
    if (!currentUser) return
    
    try {
      // Log to database using RPC function
      const { error } = await supabase.rpc('log_changelog', {
        p_user_id: currentUser.id,
        p_user_name: currentUser.name,
        p_user_role: currentUser.role,
        p_action: action,
        p_entity: entity,
        p_entity_id: entityId || null,
        p_entity_name: entityName || null,
        p_description: description,
        p_details: details || null
      })
      
      if (error) {
        console.error('❌ Failed to log action to database:', error)
        // Fallback to local storage if database fails
        const newEntry: ChangelogEntry = {
          id: `local_${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action,
          entity,
          entityId,
          entityName,
          description,
          details
        }
        setChangelog(prev => [...prev, newEntry])
      } else {
        console.log('✅ Action logged to database:', { action, entity, description })
        // Refresh changelog from database to get latest entries
        await loadChangelogFromDatabase()
      }
    } catch (error) {
      console.error('❌ Error logging action:', error)
      // Fallback to local storage
      const newEntry: ChangelogEntry = {
        id: `local_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action,
        entity,
        entityId,
        entityName,
        description,
        details
      }
      setChangelog(prev => [...prev, newEntry])
    }
  }, [currentUser, loadChangelogFromDatabase])

  // Handle logout logging after logAction is available
  useEffect(() => {
    const handleLogoutLogging = async () => {
      const logoutUser = sessionStorage.getItem('pendingLogoutLog')
      if (logoutUser && !currentUser) {
        try {
          const userData = JSON.parse(logoutUser)
          await logAction('logout', 'system', `User ${userData.name} logged out`, userData.id, userData.name)
          sessionStorage.removeItem('pendingLogoutLog')
          console.log('✅ Logout action logged successfully')
        } catch (error) {
          console.warn('Failed to log logout action:', error)
          sessionStorage.removeItem('pendingLogoutLog')
        }
      }
    }
    
    if (!currentUser) {
      handleLogoutLogging()
    }
  }, [currentUser, logAction])

  // Load changelog for admin/superadmin users after functions are initialized
  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) {
      const loadInitialChangelog = async () => {
        try {
          console.log('Loading changelog from database for admin/superadmin user...')
          await loadChangelogFromDatabase()
        } catch (error) {
          console.warn('Failed to load changelog from database:', error)
        }
      }
      loadInitialChangelog()
    }
  }, [currentUser, loadChangelogFromDatabase])

  // SuperAdmin specific functions
  const createUserBySuperAdmin = async (userData: {
    email: string
    password: string
    name: string
    username: string
    employeeNumber: string
    position: string
    role: User['role']
  }): Promise<User> => {
    console.log('Creating user via SuperAdmin - will save to Supabase database:', userData.name, userData.role)
    
    // Check if current user is superadmin
    if (!currentUser || currentUser.role !== 'superadmin') {
      throw new Error('Only SuperAdmin can create users')
    }

    // Check if Supabase service is available
    if (!superAdminService) {
      console.error('Supabase service not available - cannot save to database')
      throw new Error('Database service not available. Please check your Supabase connection.')
    }

    try {
      // Try to use the new admin function first, fall back to superAdminService if not available
      let result, error
      
      console.log('Trying create_user_by_admin function...')
      
      // Hash password (in production you should use proper bcrypt hashing)
      const passwordHash = `$2b$10$${userData.password.slice(0, 22)}`
      
      const adminResponse = await supabase.rpc('create_user_by_admin', {
        p_name: userData.name,
        p_email: userData.email,
        p_username: userData.username,
        p_password_hash: passwordHash,
        p_role: userData.role,
        p_employee_number: userData.employeeNumber,
        p_position: userData.position,
        p_avatar: null
      })
      
      // Check if the function doesn't exist (404 or PGRST202 error)
      if (adminResponse.error && (
          adminResponse.error.code === 'PGRST202' || 
          adminResponse.error.message.includes('Could not find the function')
        )) {
        console.log('create_user_by_admin not available, falling back to superAdminService...')
        
        result = await superAdminService.createUser({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          username: userData.username,
          employee_number: userData.employeeNumber,
          position: userData.position,
          role: userData.role
        })
        
        error = null
      } else {
        // Use admin function result
        result = adminResponse.data
        error = adminResponse.error
      }

      if (error) {
        console.error('Error calling user creation function:', error)
        throw error
      }

      console.log('create_user_by_admin result:', result)

      // Check if database creation was successful
      if (result && result.success) {
        // Create user object for local state
        const newUser: User = {
          id: result.user_id || Date.now().toString(),
          name: userData.name,
          email: userData.email,
          username: userData.username,
          password: '', // Don't store password in frontend
          role: userData.role,
          position: userData.position,
          employeeNumber: userData.employeeNumber
        }

        // Update local state immediately for UI responsiveness
        setUsers(prev => [...prev, newUser])
        
        // Refresh users from database using the new refreshUsers function
        try {
          console.log('🔄 Refreshing users list from database after user creation...')
          await refreshUsers()
          console.log('✅ Users list refreshed successfully after user creation')
        } catch (refreshError) {
          console.warn('⚠️ Failed to refresh users list after creation:', refreshError)
          // Continue with local state update if refresh fails
        }
        
        // Log the action
        await logAction('create', 'user', `Created new ${userData.role} user: ${userData.name}`, newUser.id, userData.name)
        
        console.log('User successfully created in database:', result)
        return newUser
      } else {
        // Handle database error
        const errorMessage = result?.error || 'Failed to create user in database'
        console.error('Database user creation failed:', errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error creating user in Supabase:', error)
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes('function create_user_by_admin') || error.message.includes('does not exist')) {
          console.error('❌ Database function create_user_by_admin does not exist. Falling back to existing method.')
          console.log('💡 Apply admin-user-view-permissions.sql script for improved user management.')
          // Don't throw error, let it fall back to superAdminService
        }
        
        if (error.message.includes('permission denied') || error.message.includes('authentication')) {
          console.error('❌ Authentication or permission error with Supabase')
          throw new Error('Database authentication failed. Please check your Supabase credentials.')
        }
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
          console.warn('Network error detected, falling back to local user creation')
        } else {
          // Re-throw database-specific errors
          throw new Error(`Database error: ${error.message}`)
        }
      }
      
      // If it's a network error, fall back to local creation for demo purposes
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.warn('Network error detected, falling back to local user creation')
        
        // Check for local duplicates
        const existingUser = users.find(u => 
          u.email === userData.email || 
          u.username === userData.username || 
          u.employeeNumber === userData.employeeNumber
        )
        
        if (existingUser) {
          if (existingUser.email === userData.email) {
            throw new Error('Email already exists')
          }
          if (existingUser.username === userData.username) {
            throw new Error('Username already exists')
          }
          if (existingUser.employeeNumber === userData.employeeNumber) {
            throw new Error('Employee number already exists')
          }
        }

        const newUser: User = {
          id: Date.now().toString(),
          name: userData.name,
          email: userData.email,
          username: userData.username,
          password: '', // Don't store password in frontend
          role: userData.role,
          position: userData.position,
          employeeNumber: userData.employeeNumber,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=3b82f6&color=fff`
        }

        setUsers(prev => [...prev, newUser])
        await logAction('create', 'user', `Created new ${userData.role} user: ${userData.name} (local fallback)`, newUser.id, userData.name)
        
        return newUser
      }
      
      // Re-throw other errors
      throw error
    }
  }

  const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
    console.log('Resetting password for user:', userId)
    
    // Check if current user is superadmin
    if (!currentUser || currentUser.role !== 'superadmin') {
      throw new Error('Only SuperAdmin can reset passwords')
    }

    const userIndex = users.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('User not found')
    }

    const updatedUser = { ...users[userIndex], password: newPassword }
    const newUsers = [...users]
    newUsers[userIndex] = updatedUser
    setUsers(newUsers)
    
    // Log the action
    await logAction('update', 'user', `Reset password for user: ${updatedUser.name}`, userId, updatedUser.name)
  }

  const generateUsername = async (name: string, employeeNumber: string): Promise<string> => {
    console.log('Generating username for:', name, employeeNumber)
    
    try {
      // Try to use Supabase function first
      const supabaseUsername = await superAdminService.generateUsername(name, employeeNumber)
      if (supabaseUsername) {
        console.log('Generated username from Supabase:', supabaseUsername)
        return supabaseUsername
      }
    } catch (error) {
      console.warn('Supabase username generation failed, using local fallback:', error)
    }
    
    // Fallback to local generation
    const firstName = name.split(' ')[0].toLowerCase()
    const empSuffix = employeeNumber.slice(-3)
    let baseUsername = firstName + empSuffix
    
    // Remove any non-alphanumeric characters
    baseUsername = baseUsername.replace(/[^a-z0-9]/g, '')
    
    let finalUsername = baseUsername
    let counter = 0
    
    // Check for uniqueness and add counter if needed
    while (users.some(u => u.username === finalUsername)) {
      counter++
      finalUsername = baseUsername + counter
    }
    
    console.log('Generated username locally:', finalUsername)
    return finalUsername
  }

  // Force refresh all data from database (for troubleshooting sync issues)
  const forceRefreshFromDatabase = async () => {
    console.log('🔄 Force refreshing all data from database...')
    
    if (!currentUser || !superAdminService) {
      console.warn('Cannot force refresh: no user or service available')
      return
    }
    
    try {
      // Refresh contacts with detailed logging
      await refreshContacts()
      
      // Refresh other data if needed
      await refreshUsers()
      await refreshChangelog()
      
      // Clear any pending sync operations
      localStorage.removeItem('pendingContactSync')
      localStorage.setItem('lastForceSync', new Date().toISOString())
      
      toast({
        title: "🔄 Database Sync Complete",
        description: "All data has been refreshed from the database",
        duration: 3000,
      })
      
      console.log('✅ Force refresh completed successfully')
    } catch (error) {
      console.error('❌ Force refresh failed:', error)
      toast({
        title: "❌ Sync Error",
        description: "Failed to refresh data from database",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const value: DatabaseContextType = {
    users,
    contacts,
    changelog,
    loading,
    usersLoading,
    contactsLoading,
    changelogLoading,
    isInitializing,
    currentUser,
    refreshUsers,
    refreshContacts,
    refreshChangelog,
    forceRefreshFromDatabase,
    syncContactsToDatabase,
    createUser,
    updateUser,
    deleteUser,
    login,
    logout,
    createContact,
    updateContact,
    deleteContact,
    logAction,
    createUserBySuperAdmin,
    resetUserPassword,
    generateUsername
  }

  console.log('DatabaseProvider: Providing context value')

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  )
}

export { DatabaseContext }