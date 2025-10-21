#!/usr/bin/env node

/**
 * Code Cleanup Script - Remove excessive console.log statements
 * Keeps error logging and essential debug information
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

// Console.log patterns to remove (keep error, warn, and essential logs)
const patternsToRemove = [
  /console\.log\(['"`]DatabaseProvider: Rendering\.\.\.['"`]\)/,
  /console\.log\(['"`]DatabaseProvider: Current user:['"`], [^)]+\)/,
  /console\.log\(['"`]refreshUsers called - fetching from database\.\.\.['"`]\)/,
  /console\.log\(['"`]Trying get_users_for_admin function\.\.\.['"`]\)/,
  /console\.log\(['"`]get_users_for_admin not available, falling back to get_users_simple\.\.\.['"`]\)/,
  /console\.log\(['"`]get_users_simple has url_encode error, falling back to direct table query\.\.\.['"`]\)/,
  /console\.log\(['"`]main\.tsx: Starting app\.\.\.['"`]\)/,
  /console\.log\(['"`]Testing authentication for:['"`], [^)]+\)/,
  /console\.log\(['"`]Auth result:['"`], [^)]+\)/,
  /console\.log\(['"`]Debugging user:['"`], [^)]+\)/,
  /console\.log\(['"`]Debug result:['"`], [^)]+\)/,
  /console\.log\(['"`]Creating test user:['"`], [^)]+\)/,
  /console\.log\(['"`]Create result:['"`], [^)]+\)/,
  /console\.log\(['"`]Creating test contact:['"`], [^)]+\)/,
  /console\.log\(['"`]Contact create result:['"`], [^)]+\)/,
  /console\.log\(['"`]Creating test contact with birthday[^)]*\)/,
  /console\.log\(['"`]Birthday test contact result:['"`], [^)]+\)/,
];

// Patterns to keep (error handling, warnings, essential info)
const patternsToKeep = [
  /console\.error/,
  /console\.warn/,
  /console\.info/,
  /console\.log.*error/i,
  /console\.log.*failed/i,
  /console\.log.*warning/i,
  /console\.log.*success.*birthday/i,
  /console\.log.*notification/i,
];

function shouldKeepLine(line) {
  // Keep if it matches any keep pattern
  if (patternsToKeep.some(pattern => pattern.test(line))) {
    return true;
  }
  
  // Remove if it matches any remove pattern
  if (patternsToRemove.some(pattern => pattern.test(line))) {
    return false;
  }
  
  // Keep by default if not explicitly targeted for removal
  return true;
}

function cleanupFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const cleanedLines = lines.filter(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('console.log')) {
        return shouldKeepLine(trimmed);
      }
      return true;
    });
    
    const cleanedContent = cleanedLines.join('\n');
    
    if (cleanedContent !== content) {
      fs.writeFileSync(filePath, cleanedContent);
      console.log(`✅ Cleaned: ${path.relative(srcDir, filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir) {
  let cleanedCount = 0;
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        cleanedCount += walkDirectory(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.js')) {
        if (cleanupFile(fullPath)) {
          cleanedCount++;
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error.message);
  }
  
  return cleanedCount;
}

console.log('🧹 Starting code cleanup...');
console.log('📁 Cleaning source directory:', srcDir);

const cleanedFiles = walkDirectory(srcDir);

console.log('\n📊 Cleanup Summary:');
console.log(`✅ Cleaned ${cleanedFiles} files`);
console.log('🔄 Kept essential error handling and warning logs');
console.log('❌ Removed verbose debug console.log statements');

console.log('\n🎯 Code cleanup completed!');