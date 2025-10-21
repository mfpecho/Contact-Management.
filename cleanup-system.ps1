# System Cleanup Script for Contacts Collaborate Admin

Write-Host "Starting System Cleanup..." -ForegroundColor Green

# Define paths
$rootPath = "d:\Controlled Shared Container\02 Restricted\Project\contacts-collaborate-admin"
$cleanupFolder = "$rootPath\_cleanup"

# Create cleanup folder
if (-not (Test-Path $cleanupFolder)) {
    New-Item -ItemType Directory -Path $cleanupFolder -Force | Out-Null
    Write-Host "Created cleanup folder" -ForegroundColor Yellow
}

# Files to move to cleanup folder
$filesToCleanup = @(
    "contact-debug-comprehensive.js",
    "user-management-debug.js",
    "quick-supabase-test.js", 
    "fix-birthday-data.js",
    "integration-examples.js",
    "test-user-sync.js",
    "test-useDatabaseContext-export.js",
    "test-session-persistence.js",
    "test-session-expiration.js", 
    "test-database-function-fixes.js",
    "test-contact-fetch.js",
    "test-birthday-calculations.js",
    "test-auth.js",
    "test-advanced-contact-filters.js",
    "test-admin-user-functions.js",
    "test-contact-accuracy.sql",
    "test-database-functions.sql",
    "comprehensive-contact-fix.sql",
    "step-by-step-diagnosis.sql",
    "supabase-rls-update-contacts.sql", 
    "supabase-rls-update.sql",
    "supabase-user-management-simple.sql",
    "fix-rls-data-visibility.sql",
    "DATABASE_AUTHENTICATION.md",
    "ERROR_FIX_SUMMARY.md",
    "INTEGRATION_STATUS.md",
    "SUPABASE_TROUBLESHOOTING.md",
    "SUPABASE_USER_CREATION.md", 
    "SUPABASE_USER_MANAGEMENT.md",
    "USERS_NOT_SHOWING_FIX.md",
    "APPLY_DATABASE_FIXES.md"
)

# Move files to cleanup folder
foreach ($file in $filesToCleanup) {
    $sourcePath = Join-Path $rootPath $file
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $cleanupFolder $file
        try {
            Move-Item -Path $sourcePath -Destination $destPath -Force
            Write-Host "Moved: $file" -ForegroundColor Green
        } catch {
            Write-Host "Failed to move: $file" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "System cleanup completed!" -ForegroundColor Green