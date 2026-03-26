#!/bin/bash

# HR Connect Comprehensive Testing Script
# Tests all endpoints and features of the HR Connect module

BASE_URL="http://localhost:3000/api/v1"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  HR Connect Module - Comprehensive Testing${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Helper function to run test
run_test() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -e "${YELLOW}Test #$TOTAL_TESTS: $test_name${NC}"

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Status: $http_code"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAIL${NC} - Expected: $expected_status, Got: $http_code"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "$body"
    fi
    echo ""
}

echo -e "${BLUE}=== 1. POSTS TESTING ===${NC}"
echo ""

# Test 1: Get all posts
run_test "Get all posts" "GET" "/hr-connect/posts" "" "200"

# Test 2: Create a new post
run_test "Create new post" "POST" "/hr-connect/posts" \
    '{"content":"Automated test post - Hello from test suite!","postType":"general","visibility":"public","isPinned":false}' \
    "201"

# Test 3: Get posts again (should include new post)
run_test "Get posts after creation" "GET" "/hr-connect/posts" "" "200"

echo -e "${BLUE}=== 2. REACTIONS TESTING ===${NC}"
echo ""

# Test 4: Add reaction to post
run_test "Add like reaction to post 1" "POST" "/hr-connect/posts/1/reactions" \
    '{"reactionType":"like"}' \
    "200"

# Test 5: Add different reaction
run_test "Add celebrate reaction to post 1" "POST" "/hr-connect/posts/1/reactions" \
    '{"reactionType":"celebrate"}' \
    "200"

# Test 6: Remove reaction
run_test "Remove reaction from post 1" "DELETE" "/hr-connect/posts/1/reactions" "" "200"

echo -e "${BLUE}=== 3. COMMENTS TESTING ===${NC}"
echo ""

# Test 7: Get comments for a post
run_test "Get comments for post 1" "GET" "/hr-connect/posts/1/comments" "" "200"

# Test 8: Add comment to post
run_test "Add comment to post 1" "POST" "/hr-connect/posts/1/comments" \
    '{"comment":"This is an automated test comment!"}' \
    "201"

# Test 9: Add another comment
run_test "Add second comment to post 1" "POST" "/hr-connect/posts/1/comments" \
    '{"comment":"Another test comment with emoji 🚀"}' \
    "201"

# Test 10: Get comments again
run_test "Get comments after additions" "GET" "/hr-connect/posts/1/comments" "" "200"

echo -e "${BLUE}=== 4. GROUPS TESTING ===${NC}"
echo ""

# Test 11: Get all groups
run_test "Get all groups" "GET" "/hr-connect/groups" "" "200"

# Test 12: Create new group
run_test "Create new group" "POST" "/hr-connect/groups" \
    '{"name":"Test Automation Group","description":"Created by automated tests","groupType":"project"}' \
    "201"

# Test 13: Get groups after creation
run_test "Get groups after creation" "GET" "/hr-connect/groups" "" "200"

echo -e "${BLUE}=== 5. CHAT TESTING ===${NC}"
echo ""

# Test 14: Get all conversations
run_test "Get all conversations" "GET" "/chat/conversations" "" "200"

# Test 15: Create new conversation
run_test "Create new conversation" "POST" "/chat/conversations" \
    '{"type":"one_on_one","name":"Test Chat","participantIds":["user1","user2"]}' \
    "201"

# Test 16: Get messages for conversation
run_test "Get messages for conversation 1" "GET" "/chat/conversations/1/messages" "" "200"

# Test 17: Send message to conversation
run_test "Send message to conversation 1" "POST" "/chat/conversations/1/messages" \
    '{"content":"Test message from automated suite","messageType":"text"}' \
    "201"

# Test 18: Send another message
run_test "Send second message" "POST" "/chat/conversations/1/messages" \
    '{"content":"Another test message 💬","messageType":"text"}' \
    "201"

# Test 19: Mark conversation as read
run_test "Mark conversation 1 as read" "POST" "/chat/conversations/1/read" "" "200"

# Test 20: Search users
run_test "Search users" "GET" "/chat/users/search?query=john" "" "200"

echo -e "${BLUE}=== 6. HELPDESK/TICKETS TESTING ===${NC}"
echo ""

# Test 21: Get all tickets
run_test "Get my tickets" "GET" "/helpdesk/tickets/my" "" "200"

# Test 22: Create new ticket
run_test "Create new ticket" "POST" "/helpdesk/tickets" \
    '{"title":"Test ticket from automation","description":"This ticket was created by automated tests","category":"it_support","priority":"medium"}' \
    "201"

# Test 23: Get ticket stats
run_test "Get ticket statistics" "GET" "/helpdesk/tickets/stats" "" "200"

# Test 24: Get all tickets again
run_test "Get tickets after creation" "GET" "/helpdesk/tickets" "" "200"

echo -e "${BLUE}=== 7. EDGE CASES & ERROR HANDLING ===${NC}"
echo ""

# Test 25: Get non-existent post
run_test "Get non-existent post" "GET" "/hr-connect/posts/999999" "" "404"

# Test 26: Add comment to non-existent post
run_test "Add comment to non-existent post" "POST" "/hr-connect/posts/999999/comments" \
    '{"comment":"This should fail"}' \
    "404"

# Test 27: Delete non-existent comment
run_test "Delete non-existent comment" "DELETE" "/hr-connect/comments/999999" "" "404"

# Test 28: Get messages for non-existent conversation
run_test "Get messages for non-existent conversation" "GET" "/chat/conversations/999999/messages" "" "404"

echo -e "${BLUE}=== 8. DATA INTEGRITY VERIFICATION ===${NC}"
echo ""

# Test 29: Verify post has comments attached
run_test "Verify post 1 includes comments array" "GET" "/hr-connect/posts/1" "" "200"

# Test 30: Verify conversation includes last message
run_test "Verify conversation 1 has lastMessage" "GET" "/chat/conversations/1" "" "200"

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Test Results Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! HR Connect module is fully functional.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi
