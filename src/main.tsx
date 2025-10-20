
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx: Starting app...')

// Expose debugging functions globally for development
if (import.meta.env.DEV) {
  import('./lib/supabase').then(({ superAdminService }) => {
    const w = window as unknown as {
      testAuth: (email: string, password: string) => Promise<unknown>
      debugUser: (email: string) => Promise<unknown>
      createTestUser: (email: string, password: string, name: string) => Promise<unknown>
      createTestContact: (firstName: string, lastName: string, phone: string, company: string, userId?: string) => Promise<unknown>
      createBirthdayTestContact: (firstName: string, lastName: string, daysFromNow: number, userId?: string) => Promise<unknown>
      getTestContacts: (userId?: string) => Promise<unknown>
      testContactAccuracy: () => Promise<unknown>
      debugContactSync: () => Promise<unknown>
      forceRefreshContacts: () => Promise<unknown>
    }
    
    w.testAuth = async (email: string, password: string) => {
      console.log('Testing authentication for:', email)
      try {
        const result = await superAdminService.authenticateUser(email, password)
        console.log('Auth result:', result)
        return result
      } catch (error) {
        console.error('Auth error:', error)
        return { error }
      }
    }
    
    w.debugUser = async (email: string) => {
      console.log('Debugging user:', email)
      try {
        const result = await superAdminService.debugUserAuth(email)
        console.log('Debug result:', result)
        return result
      } catch (error) {
        console.error('Debug error:', error)
        return { error }
      }
    }
    
    w.createTestUser = async (email: string, password: string, name: string) => {
      console.log('Creating test user:', email)
      try {
        const result = await superAdminService.createUser({
          email,
          password,
          name,
          username: email.split('@')[0],
          employee_number: 'TEST' + Date.now(),
          position: 'Test Position',
          role: 'user'
        })
        console.log('Create result:', result)
        return result
      } catch (error) {
        console.error('Create error:', error)
        return { error }
      }
    }
    
    w.createTestContact = async (firstName: string, lastName: string, phone: string, company: string, userId?: string) => {
      console.log('Creating test contact:', firstName, lastName)
      try {
        // Create a birthday 15 days from now for testing notifications
        const birthdayDate = new Date()
        birthdayDate.setDate(birthdayDate.getDate() + 15)
        const birthday = birthdayDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
        
        const result = await superAdminService.createContact({
          firstName,
          lastName,
          birthday,
          contactNumber: phone,
          company,
          userId: userId || 'default-user-id',
          middleName: ''
        })
        console.log('Contact create result:', result)
        return result
      } catch (error) {
        console.error('Contact create error:', error)
        return { error }
      }
    }
    
    w.createBirthdayTestContact = async (firstName: string, lastName: string, daysFromNow: number, userId?: string) => {
      console.log(`Creating test contact with birthday in ${daysFromNow} days:`, firstName, lastName)
      try {
        // Create a birthday with specific days from now
        const birthdayDate = new Date()
        birthdayDate.setDate(birthdayDate.getDate() + daysFromNow)
        const birthday = birthdayDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
        
        const result = await superAdminService.createContact({
          firstName,
          lastName,
          birthday,
          contactNumber: '123-456-7890',
          company: 'Test Company',
          userId: userId || 'default-user-id',
          middleName: ''
        })
        console.log('Birthday test contact result:', result)
        return result
      } catch (error) {
        console.error('Birthday test contact error:', error)
        return { error }
      }
    }
    
    w.getTestContacts = async (userId?: string) => {
      console.log('Getting test contacts for user:', userId)
      try {
        const result = await superAdminService.getContacts(userId)
        console.log('Contacts result:', result)
        return result
      } catch (error) {
        console.error('Get contacts error:', error)
        return { error }
      }
    }
    
    // Enhanced contact accuracy testing
    w.testContactAccuracy = async () => {
      console.log('🧪 CONTACT ACCURACY TEST STARTING...')
      
      try {
        // Get current user
        const currentUserStr = localStorage.getItem('currentUser')
        if (!currentUserStr) {
          console.error('❌ No current user logged in. Please login first.')
          return
        }
        
        const currentUser = JSON.parse(currentUserStr)
        console.log('👤 Testing with user:', currentUser.name)
        
        // Test 1: Create contact with accurate data
        console.log('\n1️⃣ Testing contact creation with accurate data...')
        const testContact1 = {
          firstName: 'TestAccuracy',
          middleName: 'Data',
          lastName: 'ContactTest',
          birthday: '1985-06-15',
          contactNumber: '+1-555-ACCURACY',
          company: 'Data Accuracy Testing Corp',
          userId: currentUser.id
        }
        
        const result1 = await superAdminService.createContact(testContact1)
        console.log('✅ Test contact 1 result:', result1)
        
        // Test 2: Retrieve contacts to verify accuracy
        console.log('\n2️⃣ Testing contact retrieval accuracy...')
        const retrievalResult = await superAdminService.getContacts(currentUser.id)
        console.log('📊 Retrieved contacts:', retrievalResult)
        
        if (retrievalResult.success && retrievalResult.contacts) {
          const testContactInDb = retrievalResult.contacts.find(c => 
            c.firstName === 'TestAccuracy' && c.lastName === 'ContactTest'
          )
          
          if (testContactInDb) {
            console.log('✅ Test contact found in database:', testContactInDb)
            
            // Verify data accuracy
            const isAccurate = 
              testContactInDb.firstName === testContact1.firstName &&
              testContactInDb.middleName === testContact1.middleName &&
              testContactInDb.lastName === testContact1.lastName &&
              testContactInDb.birthday === testContact1.birthday &&
              testContactInDb.contactNumber === testContact1.contactNumber &&
              testContactInDb.company === testContact1.company
              
            console.log(isAccurate ? '✅ Data accuracy verification PASSED' : '❌ Data accuracy verification FAILED')
            console.log('📋 Data comparison:', {
              original: testContact1,
              fromDatabase: testContactInDb,
              fieldsMatch: {
                firstName: testContactInDb.firstName === testContact1.firstName,
                middleName: testContactInDb.middleName === testContact1.middleName,
                lastName: testContactInDb.lastName === testContact1.lastName,
                birthday: testContactInDb.birthday === testContact1.birthday,
                contactNumber: testContactInDb.contactNumber === testContact1.contactNumber,
                company: testContactInDb.company === testContact1.company
              }
            })
          } else {
            console.log('❌ Test contact not found in retrieved data')
          }
        }
        
        console.log('\n🏁 CONTACT ACCURACY TEST COMPLETE')
        return { result1, retrievalResult }
        
      } catch (error) {
        console.error('❌ Contact accuracy test failed:', error)
        throw error
      }
    }
    
    // Advanced debugging function for contact synchronization
    w.debugContactSync = async () => {
      console.log('🔍 CONTACT SYNC DEBUG STARTING...')
      
      try {
        const currentUserStr = localStorage.getItem('currentUser')
        if (!currentUserStr) {
          console.error('❌ No current user logged in')
          return { error: 'No user logged in' }
        }
        
        const currentUser = JSON.parse(currentUserStr)
        console.log('👤 Current user:', currentUser.name, 'Role:', currentUser.role, 'ID:', currentUser.id)
        
        // Check localStorage contacts
        const localContacts = localStorage.getItem('contacts')
        const parsedLocalContacts = localContacts ? JSON.parse(localContacts) : []
        console.log('📦 localStorage contacts:', parsedLocalContacts.length)
        
        // Get database contacts
        console.log('📡 Fetching from database...')
        const userId = currentUser.role === 'user' ? currentUser.id : undefined
        const dbResult = await superAdminService.getContacts(userId)
        
        console.log('💾 Database response:', {
          success: dbResult?.success,
          contactCount: dbResult?.contacts?.length,
          error: dbResult?.error
        })
        
        if (dbResult?.success && dbResult?.contacts) {
          console.log('📊 Database vs localStorage comparison:')
          console.log('  Database contacts:', dbResult.contacts.length)
          console.log('  localStorage contacts:', parsedLocalContacts.length)
          
          // Show sample contacts from both sources
          console.log('\n📋 Sample database contacts:')
          dbResult.contacts.slice(0, 3).forEach((contact, i) => {
            console.log(`  ${i + 1}. ${contact.firstName} ${contact.lastName} (Owner: ${contact.ownerName})`)
          })
          
          console.log('\n📋 Sample localStorage contacts:')
          parsedLocalContacts.slice(0, 3).forEach((contact, i) => {
            console.log(`  ${i + 1}. ${contact.firstName} ${contact.lastName} (Owner: ${contact.ownerName})`)
          })
          
          // Check for personal vs collaborative
          const personalDb = dbResult.contacts.filter(c => c.ownerId === currentUser.id)
          const collaborativeDb = dbResult.contacts.filter(c => c.ownerId !== currentUser.id)
          
          console.log('\n🎯 Contact filtering:')
          console.log('  Personal contacts (database):', personalDb.length)
          console.log('  Collaborative contacts (database):', collaborativeDb.length)
          
          return {
            currentUser,
            localStorage: parsedLocalContacts,
            database: dbResult.contacts,
            personal: personalDb,
            collaborative: collaborativeDb
          }
        } else {
          console.error('❌ Failed to fetch from database')
          return { error: 'Database fetch failed', dbResult }
        }
      } catch (error) {
        console.error('❌ Contact sync debug failed:', error)
        return { error: error.message }
      }
    }
    
    // Force refresh contacts function
    w.forceRefreshContacts = async () => {
      console.log('🔄 FORCE REFRESH CONTACTS...')
      
      try {
        const currentUserStr = localStorage.getItem('currentUser')
        if (!currentUserStr) {
          console.error('❌ No current user logged in')
          return { error: 'No user logged in' }
        }
        
        const currentUser = JSON.parse(currentUserStr)
        const userId = currentUser.role === 'user' ? currentUser.id : undefined
        
        console.log('📡 Fetching latest contacts from database...')
        const result = await superAdminService.getContacts(userId)
        
        if (result?.success && result?.contacts) {
          console.log('✅ Contacts fetched:', result.contacts.length)
          
          // Update localStorage
          localStorage.setItem('contacts', JSON.stringify(result.contacts))
          console.log('📦 localStorage updated')
          
          // Show contact summary
          const personal = result.contacts.filter(c => c.ownerId === currentUser.id)
          const collaborative = result.contacts.filter(c => c.ownerId !== currentUser.id)
          
          console.log('📊 Refresh summary:')
          console.log('  Total contacts:', result.contacts.length)
          console.log('  Personal contacts:', personal.length)
          console.log('  Collaborative contacts:', collaborative.length)
          
          return {
            total: result.contacts.length,
            personal: personal.length,
            collaborative: collaborative.length,
            contacts: result.contacts
          }
        } else {
          console.error('❌ Force refresh failed:', result)
          return { error: 'Force refresh failed', result }
        }
      } catch (error) {
        console.error('❌ Force refresh error:', error)
        return { error: error.message }
      }
    }
    
    console.log('Debug functions available: testAuth(email, password), debugUser(email), createTestUser(email, password, name), createTestContact(firstName, lastName, phone, company, userId), createBirthdayTestContact(firstName, lastName, daysFromNow, userId), getTestContacts(userId), testContactAccuracy(), debugContactSync(), forceRefreshContacts()')
  })
}

createRoot(document.getElementById("root")!).render(<App />);
