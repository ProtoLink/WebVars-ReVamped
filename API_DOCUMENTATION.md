# Web Variables API Documentation

## Overview
The Web Variables API provides REST endpoints for managing Resonite-style cloud variables with web accessibility. This system extends Resonite's native Cloud Variables functionality to external applications while maintaining full compatibility with existing Resonite permission systems.

## Base URL
```
https://your-deployment.replit.app/api/v1
```

## Authentication

### Session Authentication (Web Dashboard)
Used by the web interface after user login via Replit Auth.

### API Key Authentication (External Access)
For external applications and scripts.

**Header Format:**
```
Authorization: Bearer YOUR_API_KEY
```

### User ID Authentication (Unsafe Variables)
For simplified integration with unsafe variables that use userId parameter authentication.

**Query Parameter Format:**
```
?userId=YOUR_USER_ID
```

## Rate Limits
- API Endpoints: 100 requests per 15 minutes per IP
- Variable Operations: 30 requests per minute per IP

## Value Format
All variable defaults and user values are stored and returned as strings. Numbers, booleans, JSON, enum names, and other structured content can still be stored, but the API treats them as text without automatic conversion.

## Permission Types
- `public` - Readable by anyone
- `friends` - Readable by friends only
- `private` - Readable by owner only
- `owner` - Full access by owner only

## Endpoints

### Health Check
```http
GET /api/health
```
Returns system status and timestamp.

### Variable Definitions

#### List Variable Definitions
```http
GET /api/v1/definitions
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "player_score",
      "type": "string",
      "defaultValue": "1500",
      "ownerId": "user-123",
      "ownerType": "user",
      "readPermission": "public",
      "writePermission": "owner",
      "listPermission": "public",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Variable Definition
```http
PUT /api/v1/definitions/{name}
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "defaultValue": "0",
  "ownerType": "user",
  "readPermission": "public",
  "writePermission": "owner",
  "listPermission": "public"
}
```

#### Update Variable Definition
```http
PATCH /api/v1/definitions/{name}
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "defaultValue": "2000",
  "readPermission": "friends"
}
```

#### Delete Variable Definition
```http
DELETE /api/v1/definitions/{name}
Authorization: Bearer YOUR_API_KEY
```

### Variable Values

#### Get Variable Value
```http
GET /api/v1/variables/{name}
Authorization: Bearer YOUR_API_KEY
```

**Alternative Authentication (Unsafe Variables):**
```http
GET /api/v1/variables/{name}?userId=YOUR_USER_ID
```

**Response Formats:**

**Text/Plain (Default for Resonite Webhooks):**
```
2100
```

**JSON Format (with ?format=json or Accept: application/json):**
```json
{
  "success": true,
  "data": {
    "name": "player_score",
    "value": "2100",
    "type": "string",
    "ownerId": "user-123",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Set Variable Value

**JSON Format (Dashboard/API Integration):**
```http
POST /api/v1/variables/{name}
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Alternative Authentication (Unsafe Variables):**
```http
POST /api/v1/variables/{name}?userId=YOUR_USER_ID
Content-Type: application/json
```

**Request Body:**
```json
{
  "value": "2500"
}
```

**Plain Text Format (Resonite Integration):**
```http
POST /api/v1/variables/{name}
Authorization: Bearer YOUR_API_KEY
Content-Type: text/plain
```

**Alternative Authentication (Unsafe Variables):**
```http
POST /api/v1/variables/{name}?userId=YOUR_USER_ID
Content-Type: text/plain
```

**Request Body:**
```
2500
```

**Response Formats:**

**Text/Plain (Default for Resonite):**
```
OK
```

**JSON Format (with ?format=json or Accept: application/json):**
```json
{
  "success": true,
  "data": {
    "name": "player_score",
    "value": "2500",
    "type": "string",
    "ownerId": "user-123",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

#### Update Variable Definition (PUT)

**JSON Format (Dashboard/API Integration):**
```http
PUT /api/v1/variables/{name}
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "value": "3000",
  "defaultValue": "1000",
  "readPermission": "public",
  "writePermission": "owner"
}
```

**Plain Text Format (Resonite Integration):**
```http
PUT /api/v1/variables/{name}?userId=YOUR_USER_ID
Content-Type: text/plain
```

**Request Body:**
```
3000
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "player_score",
    "type": "string",
    "value": "3000",
    "defaultValue": "1000",
    "ownerId": "user-123",
    "updatedAt": "2024-01-01T12:30:00Z"
  }
}
```

#### Delete Variable (DELETE)

```http
DELETE /api/v1/variables/{name}
Authorization: Bearer YOUR_API_KEY
```

**Alternative Authentication (Unsafe Variables):**
```http
DELETE /api/v1/variables/{name}?userId=YOUR_USER_ID
```

**Response:**
```json
{
  "success": true,
  "message": "Variable deleted successfully"
}
```

#### List All Values for Variable
```http
GET /api/v1/variables/{name}/values
Authorization: Bearer YOUR_API_KEY
```

### API Key Management

#### List API Keys
```http
GET /api/v1/api-keys
Authorization: Session or Bearer YOUR_API_KEY
```

#### Create API Key
```http
POST /api/v1/api-keys
Authorization: Session or Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "My Application Key"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "wv_1234567890abcdef...",
    "apiKey": {
      "id": 1,
      "name": "My Application Key",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Delete API Key
```http
DELETE /api/v1/api-keys/{id}
Authorization: Session or Bearer YOUR_API_KEY
```

### Statistics
```http
GET /api/v1/stats
Authorization: Session or Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVariables": 5,
    "totalValues": 12,
    "apiRequestsToday": 45,
    "activeUsers": 1
  }
}
```

### Search
```http
GET /api/v1/search?q=player
Authorization: Bearer YOUR_API_KEY
```

### Data Types Information
```http
GET /api/v1/types
```

**Response:**
```json
{
  "success": true,
  "data": {
    "supportedTypes": ["string"],
    "permissionTypes": ["public", "friends", "private", "owner"]
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": [
    {
      "field": "name",
      "message": "Invalid variable name"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Missing or invalid authorization header"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions to access this variable"
}
```

### 404 Not Found
```json
{
  "error": "Variable definition not found"
}
```

### 409 Conflict
```json
{
  "error": "Variable definition already exists"
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many requests from this IP"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Usage Examples

### JavaScript/Node.js
```javascript
const API_KEY = 'wv_your_api_key_here';
const BASE_URL = 'https://your-deployment.replit.app/api/v1';

// Get variable value
async function getVariable(name) {
  const response = await fetch(`${BASE_URL}/variables/${name}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });
  return response.json();
}

// Set variable value
async function setVariable(name, value) {
  const response = await fetch(`${BASE_URL}/variables/${name}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ value })
  });
  return response.json();
}
```

### Python
```python
import requests

API_KEY = 'wv_your_api_key_here'
BASE_URL = 'https://your-deployment.replit.app/api/v1'

def get_variable(name):
    response = requests.get(
        f'{BASE_URL}/variables/{name}',
        headers={'Authorization': f'Bearer {API_KEY}'}
    )
    return response.json()

def set_variable(name, value):
    response = requests.post(
        f'{BASE_URL}/variables/{name}',
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        },
        json={'value': value}
    )
    return response.json()
```

### cURL Examples

#### Get Variable Value
```bash
# Get variable as plain text
curl -H "Authorization: Bearer wv_your_api_key_here" \
     https://your-deployment.replit.app/api/v1/variables/player_score

# Get variable with userId (unsafe authentication)
curl "https://your-deployment.replit.app/api/v1/variables/player_score?userId=Tacusin"
```

#### Set Variable Value - JSON Format
```bash
# Set variable with JSON
curl -X POST \
     -H "Authorization: Bearer wv_your_api_key_here" \
     -H "Content-Type: application/json" \
     -d '{"value":"2500"}' \
     https://your-deployment.replit.app/api/v1/variables/player_score

# Set variable with userId and JSON
curl -X POST "https://your-deployment.replit.app/api/v1/variables/player_score?userId=Tacusin" \
     -H "Content-Type: application/json" \
     -d '{"value": "1500"}'
```

#### Set Variable Value - Plain Text Format (Resonite)
```bash
# Set variable with plain text
curl -X POST \
     -H "Authorization: Bearer wv_your_api_key_here" \
     -H "Content-Type: text/plain" \
     -d "2500" \
     https://your-deployment.replit.app/api/v1/variables/player_score

# Set variable with userId and plain text (Resonite style)
curl -X POST "https://your-deployment.replit.app/api/v1/variables/player_score?userId=Tacusin" \
     -d "1500"

```

#### Update Variable Value - JSON Format
```bash
# Update variable with JSON
curl -X PUT \
     -H "Authorization: Bearer wv_your_api_key_here" \
     -H "Content-Type: application/json" \
     -d '{"value":"3500","defaultValue":"1000"}' \
     https://your-deployment.replit.app/api/v1/variables/player_score

# Update variable with userId and JSON
curl -X PUT "https://your-deployment.replit.app/api/v1/variables/player_score?userId=Tacusin" \
     -H "Content-Type: application/json" \
     -d '{"value": "2000"}'
```

#### Update Variable Value - Plain Text Format (Resonite)
```bash
# Update variable with plain text
curl -X PUT \
     -H "Authorization: Bearer wv_your_api_key_here" \
     -H "Content-Type: text/plain" \
     -d "3500" \
     https://your-deployment.replit.app/api/v1/variables/player_score

# Update variable with userId and plain text (Resonite style)
curl -X PUT "https://your-deployment.replit.app/api/v1/variables/player_score?userId=Tacusin" \
     -d "2000"

```

#### Delete Variable
```bash
# Delete variable with API key
curl -X DELETE \
     -H "Authorization: Bearer wv_your_api_key_here" \
     https://your-deployment.replit.app/api/v1/variables/player_score

# Delete variable with userId (unsafe authentication)
curl -X DELETE "https://your-deployment.replit.app/api/v1/variables/player_score?userId=Tacusin"
```

## Resonite Integration

### ProtoFlux Nodes
Web Variables can be accessed from within Resonite using standard ProtoFlux nodes:

- **GET_String**: Retrieve variable values as text
- **POST_String**: Update variable values as text
- **Variable_Read**: Read variable values
- **Variable_Write**: Write variable values

### URL Format for Resonite
```
https://your-deployment.replit.app/api/v1/variables/{variable_name}?userId={your_user_id}
```

### String Handling
WebVar does not parse or convert values based on their contents. A value such as `2`, `false`, or `{"x":1}` is stored and returned as the same text supplied by the client.

### Supported Resonite Data Type
- **String:** use string-compatible nodes for all reads and writes

### Headers for Resonite HTTP Requests
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

## Security Considerations

- API keys should be stored securely and never exposed in client-side code
- Use HTTPS for all requests in production
- Implement proper permission checks before accessing variables
- Rate limits apply per IP address
- API keys can be revoked at any time through the web dashboard

## WebSocket Real-Time Updates

Connect to WebSocket for real-time variable updates:
```
wss://your-deployment.replit.app/ws
```

**Message Format:**
```json
{
  "event": "variable_updated",
  "data": {
    "name": "player_score",
    "value": "2600",
    "updatedBy": "user-123"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Support

For issues and questions:
1. Check the web dashboard for API key management
2. Review error messages for specific guidance
3. Ensure proper authentication headers are included
4. Verify variable permissions match your access level