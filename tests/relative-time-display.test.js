/* Tests for relative time display.
 *
 * Run with: node tests/relative-time-display.test.js
 */

const { calculateRelativeTime, formatRelativeTime, initRelativeTimeDisplay } = require('../public/js/relative-time-display');

function assertEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    console.error(`❌ ${message}`);
    console.error(`   Expected: ${expectedStr}`);
    console.error(`   Actual:   ${actualStr}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

function testCalculateRelativeTime() {
  console.log('\n=== Testing calculateRelativeTime ===\n');

  // Test 30 seconds ago
  const now30Sec = new Date();
  const test30Sec = new Date(now30Sec.getTime() - 30 * 1000);
  assertEqual(
    calculateRelativeTime(test30Sec, now30Sec),
    { value: 0, unit: 'just_now' },
    '30 seconds ago should be "just now"'
  );

  // Test 5 minutes ago
  const now5Min = new Date();
  const test5Min = new Date(now5Min.getTime() - 5 * 60 * 1000);
  assertEqual(
    calculateRelativeTime(test5Min, now5Min),
    { value: 5, unit: 'minutes' },
    '5 minutes ago should be 5 minutes'
  );

  // Test 2 hours ago
  const now2Hour = new Date();
  const test2Hour = new Date(now2Hour.getTime() - 2 * 60 * 60 * 1000);
  assertEqual(
    calculateRelativeTime(test2Hour, now2Hour),
    { value: 2, unit: 'hours' },
    '2 hours ago should be 2 hours'
  );

  // Test 3 days ago
  const now3Day = new Date();
  const test3Day = new Date(now3Day.getTime() - 3 * 24 * 60 * 60 * 1000);
  assertEqual(
    calculateRelativeTime(test3Day, now3Day),
    { value: 3, unit: 'days' },
    '3 days ago should be 3 days'
  );

  // Test 2 months ago
  const now2Month = new Date();
  const test2Month = new Date(now2Month.getTime() - 2 * 30 * 24 * 60 * 60 * 1000);
  assertEqual(
    calculateRelativeTime(test2Month, now2Month),
    { value: 2, unit: 'months' },
    '2 months ago should be 2 months'
  );

  // Test 2 years ago
  const now2Year = new Date();
  const test2Year = new Date(now2Year.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
  assertEqual(
    calculateRelativeTime(test2Year, now2Year),
    { value: 2, unit: 'years' },
    '2 years ago should be 2 years'
  );
}

function testFormatRelativeTime() {
  console.log('\n=== Testing formatRelativeTime ===\n');

  // Test Chinese format
  assertEqual(
    formatRelativeTime({ value: 0, unit: 'just_now' }, 'zh'),
    '刚刚',
    'Chinese: just now'
  );
  assertEqual(
    formatRelativeTime({ value: 5, unit: 'minutes' }, 'zh'),
    '5分钟前',
    'Chinese: 5 minutes'
  );
  assertEqual(
    formatRelativeTime({ value: 2, unit: 'hours' }, 'zh'),
    '2小时前',
    'Chinese: 2 hours'
  );
  assertEqual(
    formatRelativeTime({ value: 3, unit: 'days' }, 'zh'),
    '3天前',
    'Chinese: 3 days'
  );
  assertEqual(
    formatRelativeTime({ value: 2, unit: 'months' }, 'zh'),
    '2个月前',
    'Chinese: 2 months'
  );
  assertEqual(
    formatRelativeTime({ value: 2, unit: 'years' }, 'zh'),
    '2年前',
    'Chinese: 2 years'
  );

  // Test English format
  assertEqual(
    formatRelativeTime({ value: 0, unit: 'just_now' }, 'en'),
    'just now',
    'English: just now'
  );
  assertEqual(
    formatRelativeTime({ value: 5, unit: 'minutes' }, 'en'),
    '5 minutes ago',
    'English: 5 minutes'
  );
  assertEqual(
    formatRelativeTime({ value: 2, unit: 'hours' }, 'en'),
    '2 hours ago',
    'English: 2 hours'
  );
  assertEqual(
    formatRelativeTime({ value: 3, unit: 'days' }, 'en'),
    '3 days ago',
    'English: 3 days'
  );
  assertEqual(
    formatRelativeTime({ value: 2, unit: 'months' }, 'en'),
    '2 months ago',
    'English: 2 months'
  );
  assertEqual(
    formatRelativeTime({ value: 2, unit: 'years' }, 'en'),
    '2 years ago',
    'English: 2 years'
  );
}

function testInitRelativeTimeDisplay() {
  console.log('\n=== Testing initRelativeTimeDisplay ===\n');

  // Mock document
  const mockDocument = {
    querySelector: function(selector) {
      return null;
    },
    createElement: function(tag) {
      return {
        setAttribute: function() {},
        style: {},
        parentElement: null
      };
    },
    documentElement: {
      dataset: { langMode: 'zh' }
    },
    body: {
      appendChild: function() {}
    }
  };

  const mockWindow = {
    Date: Date,
    setInterval: function(callback, interval) {
      // Don't actually set interval in tests
      return { clearInterval: function() {} };
    },
    addEventListener: function() {},
    clearInterval: function() {}
  };

  // Test that init doesn't throw
  try {
    initRelativeTimeDisplay({ document: mockDocument, window: mockWindow });
    console.log('✅ initRelativeTimeDisplay does not throw');
  } catch (e) {
    console.error('❌ initRelativeTimeDisplay threw:', e.message);
    process.exit(1);
  }
}

// Run all tests
testCalculateRelativeTime();
testFormatRelativeTime();
testInitRelativeTimeDisplay();

console.log('\n✅ All tests passed!\n');
