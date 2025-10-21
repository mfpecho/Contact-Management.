// Test 1 Month Advance Birthday Notifications
// Run this in browser console to test and debug birthday notifications

async function testBirthdayNotifications() {
  console.log('🔔 TESTING BIRTHDAY NOTIFICATIONS...')
  
  try {
    // Check if we have access to services
    if (typeof window.superAdminService === 'undefined') {
      console.error('❌ superAdminService not available')
      return
    }
    
    // Get current user
    const currentUserData = sessionStorage.getItem('currentUser')
    if (!currentUserData) {
      console.error('❌ No current user found')
      return
    }
    
    const currentUser = JSON.parse(currentUserData)
    console.log(`👤 Current user: ${currentUser.name} (ID: ${currentUser.id})`)
    
    // Get all contacts
    const contactsResult = await window.superAdminService.getContacts()
    
    if (contactsResult && contactsResult.success && contactsResult.contacts) {
      const contacts = contactsResult.contacts
      console.log(`📋 Found ${contacts.length} total contacts`)
      
      // Test birthday notification calculations
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const oneMonthFromNow = new Date(today)
      oneMonthFromNow.setDate(today.getDate() + 30)
      
      const twoMonthsFromNow = new Date(today)
      twoMonthsFromNow.setDate(today.getDate() + 60)
      
      console.log('\n📅 Date ranges:')
      console.log(`   Today: ${today.toDateString()}`)
      console.log(`   30 days from now: ${oneMonthFromNow.toDateString()}`)
      console.log(`   60 days from now: ${twoMonthsFromNow.toDateString()}`)
      
      // Analyze all contacts for birthday patterns
      console.log('\n🔍 Contact analysis:')
      
      const contactsWithBirthdays = contacts.filter(c => c.birthday && c.birthday.trim() !== '')
      const myContacts = contactsWithBirthdays.filter(c => c.ownerId === currentUser.id)
      const otherUsersContacts = contactsWithBirthdays.filter(c => c.ownerId !== currentUser.id)
      
      console.log(`   Total contacts with birthdays: ${contactsWithBirthdays.length}`)
      console.log(`   My contacts with birthdays: ${myContacts.length}`)
      console.log(`   Other users' contacts with birthdays: ${otherUsersContacts.length}`)
      
      // Test upcoming birthdays (0-30 days)
      const upcomingBirthdays = contactsWithBirthdays.filter(contact => {
        const birthDate = new Date(contact.birthday)
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
        
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1)
        }
        
        return thisYearBirthday >= today && thisYearBirthday <= oneMonthFromNow
      })
      
      console.log(`\n🎉 Upcoming birthdays (0-30 days): ${upcomingBirthdays.length}`)
      upcomingBirthdays.forEach(contact => {
        const birthDate = new Date(contact.birthday)
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
        if (thisYearBirthday < today) thisYearBirthday.setFullYear(today.getFullYear() + 1)
        
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 3600 * 24))
        console.log(`   ${contact.firstName} ${contact.lastName} - ${daysUntil} days (Owner: ${contact.ownerName})`)
      })
      
      // Test collaborative birthdays (30-60 days, other users only)
      const collaborativeBirthdays = otherUsersContacts.filter(contact => {
        const birthDate = new Date(contact.birthday)
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
        
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1)
        }
        
        return thisYearBirthday > oneMonthFromNow && thisYearBirthday <= twoMonthsFromNow
      })
      
      console.log(`\n🤝 Collaborative birthdays (30-60 days): ${collaborativeBirthdays.length}`)
      if (collaborativeBirthdays.length > 0) {
        collaborativeBirthdays.forEach(contact => {
          const birthDate = new Date(contact.birthday)
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
          if (thisYearBirthday < today) thisYearBirthday.setFullYear(today.getFullYear() + 1)
          
          const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 3600 * 24))
          console.log(`   ${contact.firstName} ${contact.lastName} - ${daysUntil} days (Owner: ${contact.ownerName})`)
        })
      } else {
        console.log('   ❌ No collaborative birthdays found in 30-60 day range')
        
        // Check if there are any other users' contacts with birthdays in different ranges
        console.log('\n🔍 Debugging: Other users\' contacts by date range:')
        
        otherUsersContacts.forEach(contact => {
          const birthDate = new Date(contact.birthday)
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
          if (thisYearBirthday < today) thisYearBirthday.setFullYear(today.getFullYear() + 1)
          
          const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 3600 * 24))
          
          let range = ''
          if (daysUntil <= 30) range = '0-30 days'
          else if (daysUntil <= 60) range = '30-60 days'
          else if (daysUntil <= 90) range = '60-90 days'
          else range = '90+ days'
          
          console.log(`     ${contact.firstName} ${contact.lastName} - ${daysUntil} days (${range}) (Owner: ${contact.ownerName})`)
        })
      }
      
      // Calculate total notification count
      const totalNotifications = upcomingBirthdays.length + collaborativeBirthdays.length
      console.log(`\n🔔 Total birthday notifications: ${totalNotifications}`)
      console.log(`   Upcoming: ${upcomingBirthdays.length}`)
      console.log(`   Collaborative: ${collaborativeBirthdays.length}`)
      
      if (totalNotifications === 0) {
        console.log('\n💡 To test notifications:')
        console.log('1. Create contacts with birthdays 35-45 days from now owned by other users')
        console.log('2. Use createCollaborativeBirthdayTest() to create test data')
        console.log('3. Check if current user has access to other users\' contacts')
      }
      
      return {
        totalContacts: contacts.length,
        contactsWithBirthdays: contactsWithBirthdays.length,
        upcomingBirthdays: upcomingBirthdays.length,
        collaborativeBirthdays: collaborativeBirthdays.length,
        totalNotifications: totalNotifications
      }
      
    } else {
      console.log('❌ Failed to fetch contacts:', contactsResult?.error)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

async function createCollaborativeBirthdayTest() {
  console.log('🎂 Creating test collaborative birthday...')
  
  try {
    // Check if createTestContact is available
    if (typeof window.createTestContact === 'undefined') {
      console.error('❌ createTestContact function not available')
      return
    }
    
    // Calculate date 45 days from now (in the 30-60 day range)
    const today = new Date()
    const testDate = new Date(today)
    testDate.setDate(today.getDate() + 45)
    
    const birthdayStr = testDate.getFullYear() + '-' + 
                       String(testDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(testDate.getDate()).padStart(2, '0')
    
    console.log(`Creating test contact with birthday: ${birthdayStr} (45 days from now)`)
    
    // Create test contact - this will be owned by current user initially
    const result = await window.createTestContact(
      'Collaborative',
      'Birthday-Test',
      '555-0199',
      'Test Company',
      undefined, // Will use current user
      birthdayStr
    )
    
    console.log('✅ Test collaborative birthday contact created!')
    console.log('⚠️ Note: This contact is owned by current user')
    console.log('💡 To test collaborative notifications, this contact needs to be owned by another user')
    console.log('🔄 Run testBirthdayNotifications() to check results')
    
    return result
    
  } catch (error) {
    console.error('❌ Failed to create test collaborative birthday:', error)
  }
}

// Expose functions globally
if (typeof window !== 'undefined') {
  window.testBirthdayNotifications = testBirthdayNotifications
  window.createCollaborativeBirthdayTest = createCollaborativeBirthdayTest
}

console.log('🚀 Birthday Notification Test Tools Loaded!')
console.log('Available commands:')
console.log('- testBirthdayNotifications() - Analyze current birthday notification state')
console.log('- createCollaborativeBirthdayTest() - Create test contact with birthday 45 days away')