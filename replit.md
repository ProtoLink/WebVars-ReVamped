# WebVar - Resonite Cloud Variables API

## Overview

WebVar is a comprehensive REST API system that provides web-accessible interface for Resonite-style cloud variables with real-time synchronization and mobile-first design. The application extends Resonite's native Cloud Variables functionality to external applications, providing a unified system for managing game state, user preferences, and configuration data across different platforms.

## System Architecture

### Full-Stack TypeScript Application
- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket server for live updates
- **UI Framework**: shadcn/ui components with Tailwind CSS for styling

### Modular Structure
- **Client**: React frontend located in `/client` directory
- **Server**: Express backend in `/server` directory  
- **Shared**: Common schemas and types in `/shared` directory
- **Components**: Reusable UI components following atomic design principles

## Key Components

### Authentication System
- **Dual Authentication**: Supports both session-based (web dashboard) and API key authentication (external access)
- **Replit Auth Integration**: Built-in authentication using Replit's auth system
- **Session Management**: PostgreSQL-backed session storage with connect-pg-simple
- **API Key Management**: SHA-256 hashed API keys with secure generation and validation

### Database Layer
- **Users Table**: Stores user profiles with Replit Auth integration
- **Variable Definitions**: Schema for variable structure, types, and permissions
- **Variable Values**: User-specific values with multi-user support
- **API Keys**: Secure API key storage with hashing
- **Sessions**: Authentication session management
- **Webhooks**: Notification system (prepared for future expansion)

### Variable Management System
- **Resonite Data Types**: Full support for all Resonite-compatible types (string, int, float, bool, enum, color, etc.)
- **Permission System**: Granular permissions (public, friends, private, owner, anyone)
- **Enum Support**: Complete Resonite enum system with human-readable storage and numeric API responses
- **Multi-User Values**: Each user maintains separate values for the same variable definition
- **Anonymous Access**: Variables accessible without authentication using userId parameter

### Real-time Synchronization
- **WebSocket Server**: Live updates for variable changes across all connected clients
- **Event Broadcasting**: Real-time notifications for variable modifications
- **Connection Management**: User-specific WebSocket connections with proper cleanup

## Data Flow

### Variable Access Pattern
1. **Definition Lookup**: System first checks if variable definition exists
2. **Permission Validation**: Verifies user has appropriate read/write permissions
3. **Value Retrieval**: Fetches user-specific value or falls back to default
4. **Response Formatting**: Returns data in appropriate format (JSON for dashboard, plain text for API)

### Authentication Flow
1. **Session Auth** (Dashboard): User logs in via Replit Auth, session stored in PostgreSQL
2. **API Key Auth** (External): Applications authenticate using Bearer token in Authorization header
3. **Anonymous Auth** (Simplified): Basic access using userId query parameter for public variables

### Real-time Updates
1. **Variable Change**: User modifies variable value through any interface
2. **Database Update**: Change persisted to PostgreSQL with Drizzle ORM
3. **WebSocket Broadcast**: Real-time notification sent to all connected clients
4. **UI Refresh**: Dashboard automatically updates without page reload

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver optimized for serverless
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web server framework
- **ws**: WebSocket implementation for real-time features
- **bcrypt**: Password and API key hashing
- **express-rate-limit**: API rate limiting protection

### Frontend Dependencies
- **React 18**: Modern React with hooks and concurrent features
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui**: Unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form management with validation
- **zod**: Runtime type validation

### Development Dependencies
- **TypeScript**: Type safety across the entire stack
- **Vite**: Fast development server and build tool
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Replit-Optimized Architecture
- **Single Repository**: Monorepo structure suitable for Replit's environment
- **Environment Variables**: Database configuration through environment variables
- **Build Process**: Vite builds frontend to `/dist/public`, esbuild handles server bundling
- **Development Mode**: Hot reload for both frontend and backend during development

### Database Integration
- **PostgreSQL Provisioning**: Automatic database provisioning through Replit's system
- **Migration System**: Drizzle Kit handles schema migrations and updates
- **Connection Pooling**: Efficient connection management for serverless environments

### Production Considerations
- **Static Asset Serving**: Frontend assets served directly by Express in production
- **Process Management**: Single Node.js process handles both API and static file serving
- **Security Headers**: Helmet.js for security headers and CORS configuration

## Changelog

- June 29, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.