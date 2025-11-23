#!/bin/bash

# URL Shortener API Test Script
# This script tests all API endpoints to ensure they work correctly

API_URL="http://localhost:3001"
BASE_COLOR="\033[0m"
GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"

echo -e "${BLUE}========================================${BASE_COLOR}"
echo -e "${BLUE}URL Shortener API Test Suite${BASE_COLOR}"
echo -e "${BLUE}========================================${BASE_COLOR}"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${BASE_COLOR}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" ${API_URL}/healthz)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Health check returned 200${BASE_COLOR}"
  echo "  Response: $RESPONSE_BODY"
else
  echo -e "${RED}✗ Health check failed (Expected 200, got $HTTP_CODE)${BASE_COLOR}"
fi
echo ""

# Test 2: Create Link (Random Code)
echo -e "${YELLOW}Test 2: Create Link with Random Code${BASE_COLOR}"
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${API_URL}/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://example.com"}')
HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✓ Link created successfully (201)${BASE_COLOR}"
  RANDOM_CODE=$(echo $RESPONSE_BODY | grep -o '"code":"[^"]*' | cut -d'"' -f4)
  echo "  Generated code: $RANDOM_CODE"
  echo "  Response: $RESPONSE_BODY"
else
  echo -e "${RED}✗ Link creation failed (Expected 201, got $HTTP_CODE)${BASE_COLOR}"
fi
echo ""

# Test 3: Create Link (Custom Code)
echo -e "${YELLOW}Test 3: Create Link with Custom Code${BASE_COLOR}"
TEST_CODE="test123"
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${API_URL}/api/links \
  -H "Content-Type: application/json" \
  -d "{\"target_url\":\"https://github.com\",\"code\":\"${TEST_CODE}\"}")
HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✓ Custom code link created successfully (201)${BASE_COLOR}"
  echo "  Code: $TEST_CODE"
  echo "  Response: $RESPONSE_BODY"
else
  echo -e "${RED}✗ Custom code link creation failed (Expected 201, got $HTTP_CODE)${BASE_COLOR}"
fi
echo ""

# Test 4: Duplicate Code (Should return 409)
echo -e "${YELLOW}Test 4: Duplicate Code Test${BASE_COLOR}"
DUPLICATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${API_URL}/api/links \
  -H "Content-Type: application/json" \
  -d "{\"target_url\":\"https://example.org\",\"code\":\"${TEST_CODE}\"}")
HTTP_CODE=$(echo "$DUPLICATE_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "409" ]; then
  echo -e "${GREEN}✓ Duplicate code correctly rejected (409)${BASE_COLOR}"
else
  echo -e "${RED}✗ Duplicate code test failed (Expected 409, got $HTTP_CODE)${BASE_COLOR}"
fi
echo ""

# Test 5: Get All Links
echo -e "${YELLOW}Test 5: Get All Links${BASE_COLOR}"
LIST_RESPONSE=$(curl -s -w "\n%{http_code}" ${API_URL}/api/links)
HTTP_CODE=$(echo "$LIST_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$LIST_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Links retrieved successfully (200)${BASE_COLOR}"
  LINK_COUNT=$(echo $RESPONSE_BODY | grep -o '"id"' | wc -l)
  echo "  Number of links: $LINK_COUNT"
else
  echo -e "${RED}✗ Get all links failed (Expected 200, got $HTTP_CODE)${BASE_COLOR}"
fi
echo ""

# Test 6: Get Single Link Stats
echo -e "${YELLOW}Test 6: Get Link Statistics${BASE_COLOR}"
STATS_RESPONSE=$(curl -s -w "\n%{http_code}" ${API_URL}/api/links/${TEST_CODE})
HTTP_CODE=$(echo "$STATS_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$STATS_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Link stats retrieved successfully (200)${BASE_COLOR}"
  echo "  Response: $RESPONSE_BODY"
else
  echo -e "${RED}✗ Get link stats failed (Expected 200, got $HTTP_CODE)${BASE_COLOR}"
fi
echo ""

# Test 7: Invalid URL
echo -e "${YELLOW}Test 7: Invalid URL Test${BASE_COLOR}"
INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${API_URL}/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"not-a-valid-url"}')
HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ Invalid URL correctly rejected (400)${BASE_COLOR}"
else
  echo -e "${RED}✗ Invalid URL test failed (Expected 400, got $HTTP_CODE)${BASE_COLOR}"
fi
echo ""

# Test 8: Invalid Code Format
echo -e "${YELLOW}Test 8: Invalid Code Format Test${BASE_COLOR}"
INVALID_CODE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${API_URL}/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://example.com","code":"abc"}')
HTTP_CODE=$(echo "$INVALID_CODE_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "400" ]; then
  echo -e "${GREEN}✓ Invalid code format correctly rejected (400)${BASE_COLOR}"
else
  echo -e "${RED}✗ Invalid code format test failed (Expected 400, got $HTTP_CODE)${BASE_COLOR}"
fi
echo ""

# Test 9: Delete Link
echo -e "${YELLOW}Test 9: Delete Link${BASE_COLOR}"
DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE ${API_URL}/api/links/${TEST_CODE})
HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "204" ]; then
  echo -e "${GREEN}✓ Link deleted successfully (204)${BASE_COLOR}"
else
  echo -e "${RED}✗ Delete link failed (Expected 204, got $HTTP_CODE)${BASE_COLOR}"
fi
echo ""

# Test 10: Get Deleted Link (Should return 404)
echo -e "${YELLOW}Test 10: Get Deleted Link (Should be 404)${BASE_COLOR}"
NOT_FOUND_RESPONSE=$(curl -s -w "\n%{http_code}" ${API_URL}/api/links/${TEST_CODE})
HTTP_CODE=$(echo "$NOT_FOUND_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "404" ]; then
  echo -e "${GREEN}✓ Deleted link correctly returns 404${BASE_COLOR}"
else
  echo -e "${RED}✗ Deleted link test failed (Expected 404, got $HTTP_CODE)${BASE_COLOR}"
fi
echo ""

echo -e "${BLUE}========================================${BASE_COLOR}"
echo -e "${BLUE}Test Suite Complete${BASE_COLOR}"
echo -e "${BLUE}========================================${BASE_COLOR}"
