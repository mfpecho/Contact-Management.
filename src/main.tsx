
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
    
    console.log('Debug functions available: testAuth(email, password), debugUser(email), createTestUser(email, password, name), createTestContact(firstName, lastName, phone, company, userId), createBirthdayTestContact(firstName, lastName, daysFromNow, userId), getTestContacts(userId), testContactAccuracy()')
  })
}

createRoot(document.getElementById("root")!).render(<App />);
