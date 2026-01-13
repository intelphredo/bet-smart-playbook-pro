#!/bin/bash
# Run all edge function tests
# Usage: ./run-tests.sh [function-name]
#
# Examples:
#   ./run-tests.sh                    # Run all tests
#   ./run-tests.sh grade-predictions  # Run only grade-predictions tests
#   ./run-tests.sh --validation       # Run only validation tests

echo "🧪 Edge Function Test Suite"
echo "=============================="
echo ""

# Set environment variables for testing
export SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

run_test() {
  local name=$1
  local path=$2
  
  echo -e "${YELLOW}📋 Testing $name...${NC}"
  
  if deno test --allow-net --allow-env "$path" 2>&1; then
    echo -e "${GREEN}✅ $name passed${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ $name failed${NC}"
    ((FAILED++))
  fi
  echo ""
}

# Check if specific test requested
if [ "$1" == "--validation" ]; then
  echo "Running validation tests only..."
  run_test "Data Validation" "supabase/functions/_shared/data-validation.test.ts"
elif [ -n "$1" ]; then
  # Run specific function test
  TEST_PATH="supabase/functions/$1/index.test.ts"
  if [ -f "$TEST_PATH" ]; then
    run_test "$1" "$TEST_PATH"
  else
    echo -e "${RED}Test file not found: $TEST_PATH${NC}"
    exit 1
  fi
else
  # Run all tests
  echo "Running all edge function tests..."
  echo ""

  # Shared utilities tests
  run_test "Shared Test Utils" "supabase/functions/_shared/test-utils.ts"
  run_test "Data Validation" "supabase/functions/_shared/data-validation.test.ts"

  # Edge function tests
  run_test "save-predictions" "supabase/functions/save-predictions/index.test.ts"
  run_test "grade-predictions" "supabase/functions/grade-predictions/index.test.ts"
  run_test "record-odds" "supabase/functions/record-odds/index.test.ts"
  run_test "detect-line-movements" "supabase/functions/detect-line-movements/index.test.ts"
  run_test "fetch-weather" "supabase/functions/fetch-weather/index.test.ts"
fi

# Summary
echo "=============================="
echo "📊 Test Summary"
echo "=============================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
