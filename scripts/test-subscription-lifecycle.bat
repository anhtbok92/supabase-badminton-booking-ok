@echo off
echo Running Subscription Management Integration Tests...
echo.

npx tsx scripts/test-subscription-lifecycle.ts

echo.
echo Test execution completed.
pause
