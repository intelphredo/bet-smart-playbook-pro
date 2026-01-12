#!/bin/bash
# Run all edge function tests
# Usage: ./run-tests.sh

echo "🧪 Running Edge Function Tests..."
echo ""

# Set environment variables for testing
export SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"

# Run save-predictions tests
echo "📝 Testing save-predictions..."
deno test --allow-net --allow-env supabase/functions/save-predictions/index.test.ts

# Run grade-predictions tests
echo ""
echo "📊 Testing grade-predictions..."
deno test --allow-net --allow-env supabase/functions/grade-predictions/index.test.ts

echo ""
echo "✅ All tests completed!"
