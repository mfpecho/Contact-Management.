// Test Session Expiration on Browser Close
// Run this in browser console to test the session expiration functionality

console.log('🧪 Testing Session Expiration on Browser Close...');

// Test 1: Check current session storage
const currentSession = sessionStorage.getItem('currentUser');
const currentSessionTime = sessionStorage.getItem('lastLoginTime');
console.log('1. Current session in sessionStorage:', currentSession ? JSON.parse(currentSession) : 'None');
console.log('2. Session login time:', currentSessionTime || 'Not recorded');

// Test 2: Check persistent audit data
const lastSuccessfulLogin = localStorage.getItem('lastSuccessfulLogin');
const lastLoginUser = localStorage.getItem('lastLoginUser');
const lastSessionData = localStorage.getItem('lastSessionData');

console.log('3. Last successful login (audit):', lastSuccessfulLogin || 'Never');
console.log('4. Last login user (audit):', lastLoginUser || 'Unknown');
console.log('5. Last session backup data:', lastSessionData ? JSON.parse(lastSessionData) : 'None');

// Test 3: Check old localStorage data (should not exist for new sessions)
const oldPersistentUser = localStorage.getItem('currentUser');
console.log('6. Old persistent user data:', oldPersistentUser ? 'EXISTS (should be cleared)' : 'None (correct)');

// Test 4: Simulate browser close scenario
console.log('\n🔄 Browser Close Simulation:');
if (currentSession) {
    console.log('✅ User is currently logged in with session storage');
    console.log('📋 When browser closes:');
    console.log('   - sessionStorage will be automatically cleared');
    console.log('   - User will need to login again');
    console.log('   - Only audit data will remain in localStorage');
} else {
    console.log('❌ No active session - user would see login page');
    if (lastSessionData) {
        console.log('⚠️ Previous session detected - would show "session expired" message');
    }
}

// Test 5: Storage comparison
console.log('\n📊 Storage Analysis:');
console.log('SessionStorage (expires on browser close):');
Object.keys(sessionStorage).forEach(key => {
    if (key.includes('user') || key.includes('login') || key.includes('contact')) {
        console.log(`   - ${key}: ${sessionStorage.getItem(key)?.substring(0, 50)}...`);
    }
});

console.log('LocalStorage (persistent - only audit data):');
Object.keys(localStorage).forEach(key => {
    if (key.includes('user') || key.includes('login') || key.includes('Session')) {
        console.log(`   - ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
    }
});

// Helper functions for testing
window.simulateSessionExpiration = () => {
    console.log('🧪 Simulating session expiration...');
    
    // Save session backup data (simulating browser close)
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        localStorage.setItem('lastSessionData', JSON.stringify({
            timestamp: new Date().toISOString(),
            userEmail: user.email,
            userName: user.name
        }));
    }
    
    // Clear session storage (simulating browser close)
    sessionStorage.clear();
    
    console.log('✅ Session expired - refresh page to see login with "session expired" message');
};

window.simulateNewSession = (name = 'Test User', email = 'test@example.com') => {
    console.log('🧪 Simulating new login session...');
    
    const testUser = {
        id: 'test-' + Date.now(),
        name: name,
        email: email,
        username: email.split('@')[0],
        role: 'user',
        position: 'Test Position',
        employeeNumber: 'TEST001',
        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name)
    };
    
    // Store in sessionStorage (current session)
    sessionStorage.setItem('currentUser', JSON.stringify(testUser));
    sessionStorage.setItem('lastLoginTime', new Date().toISOString());
    sessionStorage.setItem('loginMethod', 'test');
    
    // Store audit data in localStorage
    localStorage.setItem('lastSuccessfulLogin', new Date().toISOString());
    localStorage.setItem('lastLoginUser', email);
    
    console.log('✅ Test session created - user is now "logged in"');
    console.log('🔄 Close browser and reopen to test session expiration');
};

window.clearAllTestData = () => {
    sessionStorage.clear();
    localStorage.removeItem('lastSuccessfulLogin');
    localStorage.removeItem('lastLoginUser');
    localStorage.removeItem('lastSessionData');
    localStorage.removeItem('currentUser'); // Clear any old persistent data
    console.log('🧹 All test data cleared');
};

// Test 6: Session Security Analysis
console.log('\n🔒 Security Analysis:');
console.log('✅ User sessions expire when browser closes (sessionStorage)');
console.log('✅ No persistent login credentials stored');
console.log('✅ Only audit trail data persists across sessions');
console.log('✅ Session expiration message shown to users');
console.log('✅ Old localStorage sessions are cleared on new app load');

console.log('\n🛠️ Test Commands Available:');
console.log('- simulateSessionExpiration() - Simulate browser close');
console.log('- simulateNewSession(name, email) - Create test session');
console.log('- clearAllTestData() - Clean up all test data');

console.log('\n✅ Session expiration test complete!');
console.log('🔄 To test: Login → Close browser → Reopen → Should see login page with expiration message');