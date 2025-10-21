// Fix Birthday Data Issues
// Run these functions in browser console to add birthday data to existing contacts

async function fixBirthdayData() {
  console.log('🎂 FIXING BIRTHDAY DATA ISSUES...')
  
  try {
    // Check if we have the necessary services
    if (typeof window.superAdminService === 'undefined') {
      console.error('❌ superAdminService not available')
      return
    }
    
    // Get all contacts
    console.log('📋 Fetching all contacts...')
    const contactsResult = await window.superAdminService.getContacts()
    
    if (contactsResult && contactsResult.success && contactsResult.contacts) {
      const contacts = contactsResult.contacts
      console.log(`✅ Found ${contacts.length} total contacts`)
      
      // Find contacts without birthdays
      const contactsWithoutBirthdays = contacts.filter(c => !c.birthday || c.birthday.trim() === '')
      const contactsWithBirthdays = contacts.filter(c => c.birthday && c.birthday.trim() !== '')
      
      console.log(`📊 Birthday Status:`)
      console.log(`   - Contacts with birthdays: ${contactsWithBirthdays.length}`)
      console.log(`   - Contacts without birthdays: ${contactsWithoutBirthdays.length}`)
      
      if (contactsWithBirthdays.length > 0) {
        console.log('\n📅 Existing birthday data:')
        contactsWithBirthdays.slice(0, 3).forEach(contact => {
          console.log(`   - ${contact.firstName} ${contact.lastName}: ${contact.birthday}`)
        })
      }
      
      if (contactsWithoutBirthdays.length > 0) {
        console.log('\n⚠️ Contacts missing birthday data:')
        contactsWithoutBirthdays.slice(0, 5).forEach(contact => {
          console.log(`   - ${contact.firstName} ${contact.lastName} (ID: ${contact.id})`)
        })
        
        console.log('\n💡 To fix missing birthdays:')
        console.log('1. Use addRandomBirthdays() to add random birthdays for testing')
        console.log('2. Use addBirthdayToContact(contactId, "YYYY-MM-DD") for specific contacts')
        console.log('3. Edit contacts manually through the UI')
      }
      
      return {
        total: contacts.length,
        withBirthdays: contactsWithBirthdays.length,
        withoutBirthdays: contactsWithoutBirthdays.length,
        contactsNeedingBirthdays: contactsWithoutBirthdays
      }
      
    } else {
      console.log('❌ Failed to fetch contacts:', contactsResult?.error)
    }
    
  } catch (error) {
    console.error('❌ Fix birthday data failed:', error)
  }
}

async function addRandomBirthdays() {
  console.log('🎲 Adding random birthdays to contacts without birthday data...')
  
  try {
    const result = await fixBirthdayData()
    
    if (!result || result.contactsNeedingBirthdays.length === 0) {
      console.log('✅ All contacts already have birthday data!')
      return
    }
    
    const contactsToUpdate = result.contactsNeedingBirthdays.slice(0, 5) // Limit to first 5 for safety
    
    console.log(`🔄 Updating ${contactsToUpdate.length} contacts with random birthdays...`)
    
    for (const contact of contactsToUpdate) {
      // Generate random birthday (1980-2000 range)
      const year = 1980 + Math.floor(Math.random() * 20)
      const month = 1 + Math.floor(Math.random() * 12)
      const day = 1 + Math.floor(Math.random() * 28) // Safe day range
      
      const birthday = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      console.log(`   Updating ${contact.firstName} ${contact.lastName} with birthday: ${birthday}`)
      
      // Update the contact
      await addBirthdayToContact(contact.id, birthday)
    }
    
    console.log('✅ Random birthdays added successfully!')
    console.log('🔄 Refresh the page to see updated birthday calculations')
    
  } catch (error) {
    console.error('❌ Failed to add random birthdays:', error)
  }
}

async function addBirthdayToContact(contactId, birthday) {
  console.log(`🔄 Adding birthday ${birthday} to contact ${contactId}...`)
  
  try {
    if (typeof window.superAdminService === 'undefined') {
      console.error('❌ superAdminService not available')
      return
    }
    
    // Validate birthday format
    const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!birthdayRegex.test(birthday)) {
      console.error('❌ Invalid birthday format. Use YYYY-MM-DD')
      return
    }
    
    // Update the contact with birthday
    const result = await window.superAdminService.updateContact(contactId, {
      birthday: birthday
    })
    
    if (result && result.success) {
      console.log(`✅ Successfully added birthday ${birthday} to contact`)
    } else {
      console.log(`❌ Failed to update contact:`, result?.error)
    }
    
    return result
    
  } catch (error) {
    console.error('❌ Failed to add birthday to contact:', error)
  }
}

async function addTodayBirthdayTest() {
  console.log('🎉 Creating test contact with today\'s birthday...')
  
  try {
    if (typeof window.createTestContact === 'undefined') {
      console.error('❌ createTestContact function not available')
      return
    }
    
    const today = new Date()
    const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0')
    
    console.log(`Creating test contact with birthday: ${todayStr}`)
    
    // Create test contact with today's birthday
    const result = await window.createBirthdayTestContact('Birthday', 'Today', 0)
    
    console.log('✅ Test contact created with today\'s birthday!')
    console.log('🔄 Check the birthday box - it should show 1 birthday today')
    
    return result
    
  } catch (error) {
    console.error('❌ Failed to create today birthday test:', error)
  }
}

// Expose functions globally
if (typeof window !== 'undefined') {
  window.fixBirthdayData = fixBirthdayData
  window.addRandomBirthdays = addRandomBirthdays
  window.addBirthdayToContact = addBirthdayToContact
  window.addTodayBirthdayTest = addTodayBirthdayTest
}

console.log('🚀 Birthday Fix Tools Loaded!')
console.log('Available commands:')
console.log('- fixBirthdayData() - Analyze birthday data issues')
console.log('- addRandomBirthdays() - Add random birthdays to contacts without birthday data')
console.log('- addBirthdayToContact(contactId, "YYYY-MM-DD") - Add birthday to specific contact')
console.log('- addTodayBirthdayTest() - Create test contact with today\'s birthday')