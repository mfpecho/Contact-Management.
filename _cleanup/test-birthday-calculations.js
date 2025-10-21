// Birthday calculation test cases
// Use this to validate the fixes work correctly

const testCases = [
  // Test case 1: Today's birthday
  {
    birthday: '1990-10-20', // Replace with today's date
    description: 'Today birthday',
    expected: 'Should be 0 days until birthday'
  },
  
  // Test case 2: Tomorrow's birthday
  {
    birthday: '1990-10-21', // Replace with tomorrow's date
    description: 'Tomorrow birthday', 
    expected: 'Should be 1 day until birthday'
  },
  
  // Test case 3: Birthday next week
  {
    birthday: '1990-10-27', // Replace with date 7 days from today
    description: 'Birthday next week',
    expected: 'Should be 7 days until birthday'
  },
  
  // Test case 4: Birthday already passed this year
  {
    birthday: '1990-01-15', // January date (assuming current date is after Jan)
    description: 'Birthday passed this year',
    expected: 'Should calculate days until next year birthday'
  },
  
  // Test case 5: Invalid birthday formats
  {
    birthday: '1990/01/15',
    description: 'Invalid format (slashes)',
    expected: 'Should handle gracefully'
  },
  {
    birthday: 'invalid-date',
    description: 'Invalid date string',
    expected: 'Should return 0 or handle gracefully'
  },
  {
    birthday: '',
    description: 'Empty string',
    expected: 'Should return 0'
  },
  
  // Test case 6: Leap year edge case
  {
    birthday: '1992-02-29',
    description: 'Leap year birthday',
    expected: 'Should handle leap year correctly'
  }
];

console.log('🎂 BIRTHDAY CALCULATION TEST CASES');
console.log('='.repeat(50));

// Helper function (copy from your component)
const getDaysUntilBirthday = (birthday) => {
  if (!birthday) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parse birthday string consistently (assuming YYYY-MM-DD format)
  const parts = birthday.split('-');
  if (parts.length !== 3) return 0;
  
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return 0;
  
  // Create this year's birthday
  const thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
  thisYearBirthday.setHours(0, 0, 0, 0);
  
  // If birthday already passed this year, use next year
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  const timeDiff = thisYearBirthday.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// Run tests
testCases.forEach((testCase, index) => {
  const result = getDaysUntilBirthday(testCase.birthday);
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`  Birthday: ${testCase.birthday}`);
  console.log(`  Result: ${result} days`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log('---');
});

// Additional debugging
console.log('\n📅 CURRENT DATE INFO:');
const today = new Date();
console.log(`Today: ${today.toISOString().split('T')[0]}`);
console.log(`Year: ${today.getFullYear()}`);
console.log(`Month: ${today.getMonth() + 1} (${today.toLocaleString('default', { month: 'long' })})`);
console.log(`Day: ${today.getDate()}`);

// Test with your actual contact data
console.log('\n🧪 TO TEST WITH YOUR ACTUAL DATA:');
console.log('1. Update the test case dates to match current date');
console.log('2. Add your actual contact birthdays to test');
console.log('3. Run this in browser console');
console.log('4. Verify the calculations match expected results');

// Export for easy access
if (typeof window !== 'undefined') {
  window.testBirthdayCalculations = getDaysUntilBirthday;
  console.log('\n✅ Test function available as: window.testBirthdayCalculations(birthday)');
}