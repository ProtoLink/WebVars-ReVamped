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

## Rate Limits
- API Endpoints: 100 requests per 15 minutes per IP
- Variable Operations: 30 requests per minute per IP

## Data Types
Supports all Resonite-compatible data types:
- `string` - Text values
- `int` - Integer numbers
- `float` - Floating-point numbers
- `bool` - Boolean true/false values

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
      "type": "int",
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
  "type": "int",
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

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "player_score",
    "value": "2100",
    "type": "int",
    "ownerId": "user-123",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Set Variable Value
```http
POST /api/v1/variables/{name}
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "value": "2500"
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
    "supportedTypes": ["string", "int", "float", "bool"],
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
      "field": "type",
      "message": "Invalid data type"
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

### cURL
```bash
# Get variable
curl -H "Authorization: Bearer wv_your_api_key_here" \
     https://your-deployment.replit.app/api/v1/variables/player_score

# Set variable
curl -X POST \
     -H "Authorization: Bearer wv_your_api_key_here" \
     -H "Content-Type: application/json" \
     -d '{"value":"2500"}' \
     https://your-deployment.replit.app/api/v1/variables/player_score
```

## Resonite Integration

### ProtoFlux Nodes
Web Variables can be accessed from within Resonite using standard ProtoFlux nodes:

- **GET_String**: Retrieve string variable values
- **POST_String**: Update string variable values
- **Variable_Read**: Read typed variable values
- **Variable_Write**: Write typed variable values

### URL Format for Resonite
```
https://your-deployment.replit.app/api/v1/variables/{variable_name}
```

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