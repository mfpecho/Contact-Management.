// Test Session Persistence
// Run this in browser console to test the authentication session persistence

console.log('🧪 Testing Session Persistence...');

// Test 1: Check if currentUser is stored in localStorage
const currentUser = localStorage.getItem('currentUser');
console.log('1. Current user in localStorage:', currentUser ? JSON.parse(currentUser) : 'None');

// Test 2: Check last login time
const lastLoginTime = localStorage.getItem('lastLoginTime');
console.log('2. Last login time:', lastLoginTime || 'Not recorded');

// Test 3: Check login method
const loginMethod = localStorage.getItem('loginMethod');
console.log('3. Login method:', loginMethod || 'Not recorded');

// Test 4: Check if other session data exists
const contacts = localStorage.getItem('contacts');
const lastContactSync = localStorage.getItem('lastContactSync');
console.log('4. Contacts in storage:', contacts ? JSON.parse(contacts).length + ' contacts' : 'None');
console.log('5. Last contact sync:', lastContactSync || 'Never');

// Test 5: Simulate page refresh scenario
console.log('\n🔄 Simulating page refresh...');
if (currentUser) {
    const user = JSON.parse(currentUser);
    console.log('✅ Session would be restored for:', user.name, '(' + user.role + ')');
    console.log('✅ User would remain logged in after page refresh');
} else {
    console.log('❌ No session to restore - user would need to login again');
}

// Test 6: Check session validity
if (currentUser && lastLoginTime) {
    const loginTime = new Date(lastLoginTime);
    const now = new Date();
    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
    
    console.log('\n📊 Session Info:');
    console.log('- Login time:', loginTime.toLocaleString());
    console.log('- Hours since login:', hoursSinceLogin.toFixed(2));
    console.log('- Session valid:', hoursSinceLogin < 24 ? '✅ Yes' : '⚠️ Expired (>24h)');
}

// Helper function to clear session (for testing logout)
window.clearTestSession = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('lastLoginTime');
    localStorage.removeItem('loginMethod');
    console.log('🧹 Test session cleared');
};

// Helper function to simulate login (for testing)
window.simulateLogin = (name = 'Test User', role = 'user') => {
    const testUser = {
        id: 'test-' + Date.now(),
        name: name,
        email: 'test@example.com',
        username: 'testuser',
        role: role,
        position: 'Test Position',
        employeeNumber: 'TEST001',
        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name)
    };
    
    localStorage.setItem('currentUser', JSON.stringify(testUser));
    localStorage.setItem('lastLoginTime', new Date().toISOString());
    localStorage.setItem('loginMethod', 'test');
    
    console.log('🧪 Test login simulated for:', name);
    console.log('Refresh the page to see if session persists');
};

console.log('\n🛠️ Test Commands Available:');
console.log('- clearTestSession() - Clear the current session');
console.log('- simulateLogin("Name", "role") - Simulate a login');
console.log('- simulateLogin() - Simulate default test user login');

console.log('\n✅ Session persistence test complete!');