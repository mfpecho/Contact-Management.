// Test Database Function Fixes
// Run this in browser console to verify the database function fixes

console.log('🔧 Testing Database Function Fixes...');

// Function to test database connectivity and function availability
const testDatabaseFunctions = async () => {
    try {
        console.log('\n📡 Testing Supabase Connection...');
        
        // Test the debug function first
        if (window.superAdminService) {
            try {
                console.log('🔍 Calling debug_database_functions...');
                const debugResult = await window.superAdminService.supabase
                    .rpc('debug_database_functions');
                
                if (debugResult.error) {
                    console.error('❌ Debug function error:', debugResult.error);
                } else {
                    console.log('✅ Debug function result:', debugResult.data);
                    const data = debugResult.data;
                    
                    console.log('\n📊 Database Status:');
                    console.log('  - Database Status:', data.database_status);
                    console.log('  - Contacts Table:', data.tables?.contacts?.exists ? `✅ Exists (${data.tables.contacts.count} records)` : '❌ Missing');
                    console.log('  - Users Table:', data.tables?.users?.exists ? `✅ Exists (${data.tables.users.count} records)` : '❌ Missing');
                    console.log('  - Changelog Table:', data.tables?.changelog?.exists ? `✅ Exists (${data.tables.changelog.count} records)` : '❌ Missing');
                    
                    console.log('\n🔧 Function Status:');
                    console.log('  - get_contacts_simple:', data.functions?.get_contacts_simple || 'unknown');
                    console.log('  - get_changelog:', data.functions?.get_changelog || 'unknown');
                    console.log('  - log_changelog:', data.functions?.log_changelog || 'unknown');
                }
            } catch (error) {
                console.warn('⚠️ Debug function not available or failed:', error.message);
            }
            
            // Test get_contacts_simple function
            console.log('\n📋 Testing get_contacts_simple function...');
            try {
                const contactsResult = await window.superAdminService.supabase
                    .rpc('get_contacts_simple');
                
                if (contactsResult.error) {
                    console.error('❌ get_contacts_simple error:', contactsResult.error);
                    console.log('📝 This suggests the GROUP BY fix may not have been applied yet');
                } else {
                    console.log('✅ get_contacts_simple working correctly');
                    const data = contactsResult.data;
                    console.log(`  - Success: ${data.success}`);
                    console.log(`  - Contact count: ${data.count}`);
                    console.log(`  - Contacts array length: ${data.contacts?.length || 0}`);
                    
                    if (data.contacts && data.contacts.length > 0) {
                        console.log('  - Sample contact:', {
                            name: `${data.contacts[0].firstName} ${data.contacts[0].lastName}`,
                            company: data.contacts[0].company,
                            owner: data.contacts[0].ownerName
                        });
                    }
                }
            } catch (error) {
                console.error('❌ get_contacts_simple test failed:', error.message);
            }
            
            // Test get_changelog function
            console.log('\n📜 Testing get_changelog function...');
            try {
                const changelogResult = await window.superAdminService.supabase
                    .rpc('get_changelog', { p_limit: 5, p_offset: 0 });
                
                if (changelogResult.error) {
                    console.error('❌ get_changelog error:', changelogResult.error);
                    console.log('📝 This suggests the function may need to be created or fixed');
                } else {
                    console.log('✅ get_changelog working correctly');
                    const data = changelogResult.data;
                    console.log(`  - Success: ${data.success}`);
                    console.log(`  - Total entries: ${data.total}`);
                    console.log(`  - Returned entries: ${data.changelog?.length || 0}`);
                    
                    if (data.changelog && data.changelog.length > 0) {
                        console.log('  - Latest entry:', {
                            action: data.changelog[0].action,
                            entity: data.changelog[0].entity,
                            user: data.changelog[0].userName,
                            description: data.changelog[0].description
                        });
                    }
                }
            } catch (error) {
                console.error('❌ get_changelog test failed:', error.message);
            }
            
            // Test using the main service method
            console.log('\n🔄 Testing main service getContacts method...');
            try {
                const serviceResult = await window.superAdminService.getContacts();
                
                if (serviceResult && serviceResult.success) {
                    console.log('✅ Main service getContacts working correctly');
                    console.log(`  - Contact count: ${serviceResult.contacts?.length || 0}`);
                    
                    if (serviceResult.contacts && serviceResult.contacts.length > 0) {
                        console.log('  - Sample contact from service:', {
                            name: `${serviceResult.contacts[0].firstName} ${serviceResult.contacts[0].lastName}`,
                            company: serviceResult.contacts[0].company,
                            owner: serviceResult.contacts[0].ownerName
                        });
                    }
                } else {
                    console.error('❌ Main service getContacts failed:', serviceResult?.error || 'Unknown error');
                }
            } catch (error) {
                console.error('❌ Main service test failed:', error.message);
            }
            
        } else {
            console.error('❌ superAdminService not available - make sure you\'re on the correct page');
        }
        
    } catch (error) {
        console.error('❌ Overall test failed:', error);
    }
};

// Function to test specific RPC calls
const testSpecificRPC = async (functionName, params = {}) => {
    if (!window.superAdminService) {
        console.error('❌ superAdminService not available');
        return;
    }
    
    try {
        console.log(`🧪 Testing RPC function: ${functionName}`);
        console.log(`📥 Parameters:`, params);
        
        const result = await window.superAdminService.supabase.rpc(functionName, params);
        
        if (result.error) {
            console.error(`❌ ${functionName} error:`, result.error);
        } else {
            console.log(`✅ ${functionName} success:`, result.data);
        }
        
        return result;
    } catch (error) {
        console.error(`❌ ${functionName} exception:`, error.message);
        return null;
    }
};

// Function to check if specific functions exist
const checkFunctionExists = async (functionName) => {
    if (!window.superAdminService) {
        console.error('❌ superAdminService not available');
        return false;
    }
    
    try {
        // Try to call the function with minimal parameters
        const result = await window.superAdminService.supabase.rpc(functionName);
        return !result.error || result.error.code !== 'PGRST202'; // PGRST202 = function not found
    } catch (error) {
        return false;
    }
};

// Main test execution
console.log('🚀 Starting database function tests...');
testDatabaseFunctions();

// Helper functions for manual testing
window.testDatabaseFunctions = testDatabaseFunctions;
window.testSpecificRPC = testSpecificRPC;
window.checkFunctionExists = checkFunctionExists;

// Quick test commands
window.quickTestContacts = () => testSpecificRPC('get_contacts_simple');
window.quickTestChangelog = () => testSpecificRPC('get_changelog', { p_limit: 5, p_offset: 0 });
window.quickTestDebug = () => testSpecificRPC('debug_database_functions');

console.log('\n🛠️ Manual Test Commands Available:');
console.log('- testDatabaseFunctions() - Run full test suite');
console.log('- quickTestContacts() - Test contacts function only');
console.log('- quickTestChangelog() - Test changelog function only');
console.log('- quickTestDebug() - Test debug function only');
console.log('- testSpecificRPC("function_name", {params}) - Test any RPC function');
console.log('- checkFunctionExists("function_name") - Check if function exists');

console.log('\n📋 Common Issues and Solutions:');
console.log('1. GROUP BY Error in get_contacts_simple:');
console.log('   ❌ "column c.created_at must appear in GROUP BY clause"');
console.log('   ✅ Solution: Run fix-database-function-errors.sql in Supabase SQL Editor');
console.log('');
console.log('2. Function Not Found Error:');
console.log('   ❌ "Could not find the function public.get_changelog"');
console.log('   ✅ Solution: Run fix-database-function-errors.sql to create missing functions');
console.log('');
console.log('3. Permission Errors:');
console.log('   ❌ "permission denied for function"');
console.log('   ✅ Solution: The fix script includes proper GRANT statements');

setTimeout(() => {
    console.log('\n🔄 Automatic retest in 3 seconds...');
    setTimeout(() => {
        console.log('\n🔄 Running automatic retest...');
        testDatabaseFunctions();
    }, 3000);
}, 2000);