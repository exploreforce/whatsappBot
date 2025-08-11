# WhatsApp Bot Documentation

## 1. General App Information

This project is a full-stack application designed to provide a configurable AI-powered WhatsApp chatbot for business owners. The chatbot can handle tasks like appointment booking through AI tool calls and is integrated with an internal calendar system. The application features a clean frontend for configuration and testing.

### Features:

*   **AI-Powered Chatbot:** A WhatsApp chatbot that can understand and respond to user queries.
*   **Appointment Booking:** The chatbot can book appointments for users by checking for availability in an internal calendar.
*   **Internal Calendar System:** A calendar system that manages availability, appointments, and blackout dates.
*   **Advanced Bot Configuration:** A comprehensive configuration interface that allows customization of:
    *   Bot identity (name, description)
    *   Personality and tonality (9 different tones: professional, friendly, casual, flirtatious, direct, emotional, warm, confident, playful)
    *   Character traits and background information
    *   Services offered and escalation rules
    *   Bot limitations and boundaries
    *   Automatic system prompt generation from configuration
*   **Test Chat:** A chat interface for testing the chatbot's responses and tool calls.
*   **WhatsApp Integration:** The application is integrated with the WhatsApp API to send and receive messages.

## 2. App Structure

The project is organized into a monorepo with the following directory structure:

*   `/backend`: Contains the Node.js/Express backend, which handles the API, business logic, and database interactions.
*   `/database`: Contains the Knex.js database schema, migrations, and seeds.
*   `/frontend`: Contains the Next.js frontend, which provides the user interface for configuring and testing the chatbot.
*   `/shared`: Contains any shared types or utilities that are used by both the frontend and backend.
*   `docker-compose.yml`: Docker Compose file to run frontend and backend together for self-hosting.
*   `backend/Dockerfile`: Dockerfile to build and run the backend service.
*   `Dockerfile`: Dockerfile to build and run the frontend service.

## 3. File List

This section provides a detailed list of all the files in the project, along with a description of their purpose and a list of their external function calls and definitions.

### 3.1. `backend`

The `backend` directory contains the Node.js/Express backend, which handles the API, business logic, and database interactions.

#### 3.1.1. `src`

The `src` directory contains the source code for the backend.

*   `index.ts`: The main entry point for the backend application. It initializes the Express server, sets up the middleware, and registers the API routes.
*   `middleware/errorHandler.ts`: Contains the `asyncHandler` middleware, which wraps async route handlers and passes any errors to the error handling middleware.
*   `middleware/logger.ts`: Contains the `logger` middleware, which logs incoming requests to the console.
*   `models/database.ts`: Contains the `Database` class, which provides a high-level API for interacting with the database.
*   `routes/appointments.ts`: Contains the API routes for managing appointments.
*   `routes/bot.ts`: Contains the API routes for the bot, including the test chat functionality which uses identical logic to WhatsApp chat (with realistic typing delays, draft/sent status workflow).
*   `routes/calendar.ts`: Contains the API routes for managing the calendar, including availability and overview.
*   `routes/index.ts`: The main router file, which combines all the other route files into a single router.
*   `routes/whatsapp.ts`: Contains the webhook routes for the WhatsApp integration.
*   `services/aiService.ts`: Contains the `AIService` class, which handles the interaction with the OpenAI API, including dynamic system prompt generation based on bot configuration, configurable content filtering policies, and execution of AI tool calls for functionalities like availability checking and appointment booking.
*   `services/whatsappService.ts`: Contains the `WhatsAppService` class, which handles both WhatsApp and Test Chat message processing with identical logic, including incoming messages, AI responses, realistic typing delays, and managing message states (draft, sent).
*   `types/index.ts`: Contains the TypeScript type definitions for the backend, including types for bot configuration, appointments, availability, chat messages (with status), and newly added service management.
*   `utils/calendarUtils.ts`: Contains utility functions for calendar-related operations, suchs as generating time slots and checking for blackout dates.
*   `utils/index.ts`: Contains various utility functions that are used throughout the backend.
*   `utils/typingDelay.ts`: Contains the `TypingDelayService` class, which provides realistic typing delays for bot responses, simulating human-like response timing based on message length plus random delays.

### 3.2. `database`

The `database` directory contains the Knex.js database schema, migrations, and seeds.

*   `knexfile.ts`: The Knex.js configuration file. It contains the database connection settings for different environments (development, staging, production).
*   `migrations/`: This directory contains the database migration files. Each file represents a change to the database schema.
    *   `20240723120000_create_initial_tables.ts`: Creates the initial database tables, including `bot_configs`, `appointments`, `availability_configs`, and `blackout_dates`.
    *   `20240723140000_create_chat_tables.ts`: Creates the tables for managing chat sessions and messages, including `test_chat_sessions` and `chat_messages`.
    *   `20250724144050_extend_bot_configs_table.js`: Extends the `bot_configs` table with advanced configuration fields including bot identity, personality settings, character traits, services offered, escalation rules, limitations, and generated system prompt storage.
*   `seeds/`: This directory contains the database seed files. Each file contains data that can be used to populate the database.
    *   `01_bot_config.ts`: Populates the `bot_configs` table with initial configuration data.

### 3.3. `frontend`

The `frontend` directory contains the Next.js frontend, which provides the user interface for configuring and testing the chatbot.

#### 3.3.1. `src`

The `src` directory contains the source code for the frontend.

##### `app`

The `app` directory contains the application's routes.

*   `layout.tsx`: The root layout for the application. It includes the main HTML structure and the `Inter` font.
*   `page.tsx`: The main dashboard page. It displays an overview of the application and provides links to the other pages, including a new link to the mobile-optimized view.
*   `calendar/page.tsx`: The calendar page. It displays the calendar, including the overview and the appointment view.
*   `config/page.tsx`: The bot configuration page. It displays the form for updating the bot's configuration.
*   `mobile/page.tsx`: The mobile-optimized main page, possibly an alternative entry point for smaller screens or specific mobile functionalities.
*   `test-chat/page.tsx`: The test chat page. It displays the chat interface for testing the chatbot.

##### `components`

The `components` directory contains the reusable React components that are used throughout the application.

*   `BotConfigForm.tsx`: A comprehensive form for configuring the AI bot with advanced options including bot identity, personality settings, character traits, services offered, escalation rules, limitations, and automatic system prompt generation with live preview.
*   `Calendar.tsx`: A comprehensive calendar management system with tabbed interface featuring calendar view and availability settings. Handles appointment data fetching, date range selection, overview statistics, and integrates both CalendarView and AvailabilitySettings components.
*   `calendar/CalendarView.tsx`: An advanced calendar view component built on `react-big-calendar` with full appointment management capabilities including create, edit, delete appointments through modal interface, color-coded appointment status, German localization, and multiple view modes (month, week, day, agenda).
*   `chat/ChatInput.tsx`: The chat input component. It contains the input field and the send button.
*   `chat/MessageBubble.tsx`: The message bubble component. It displays a single chat message.
*   `chat/TestChat.tsx`: The main component for the test chat interface.
*   `chat/ToolCallDisplay.tsx`: The component for displaying the AI's tool calls.
*   `ui/`: This directory contains the reusable UI components that are used throughout the application.
    *   `Alert.tsx`: The alert component. It can display different types of messages (info, warning, error, success).
    *   `Button.tsx`: The button component. It supports different styles and loading states.
    *   `Card.tsx`: The card component. It provides a container with a shadow and rounded corners.
    *   `Input.tsx`: The input component. It supports labels, icons, and error states.
    *   `Select.tsx`: The select component. It provides a dropdown menu.
    *   `Spinner.tsx`: The spinner component. It displays a spinning animation to indicate loading states.
    *   `Switch.tsx`: The switch/toggle component for boolean values with support for both change events and checked change callbacks.
    *   `Textarea.tsx`: The textarea component.

##### `hooks`

The `hooks` directory contains the custom React hooks that are used throughout the application.

*   `useApi.ts`: Contains the `useApi` and `useFetch` hooks, which provide a convenient way to make API requests and manage loading and error states.

##### `types`

The `types` directory contains the TypeScript type definitions for the frontend.

*   `index.ts`: Contains all the TypeScript type definitions that are used throughout the frontend.

##### `utils`

The `utils` directory contains various utility functions that are used throughout the frontend.

*   `api.ts`: Contains the `axios` instances and the API service objects that are used to make API requests to the backend.
*   `index.ts`: Contains various utility functions, including the `cn` function for conditionally joining class names and the `formatTime` function for formatting timestamps.

##### Deployment & Docker

*   `Dockerfile` (root): Multi-stage Next.js build producing a standalone server that listens on port 3000. Build args `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` can be provided at build time; defaults point to `http://backend:5000` for Compose networks.
*   `frontend/.dockerignore`: Excludes `node_modules`, `.next`, logs, and local env files from the Docker build context.
*   `deploy/docker-compose.prod.yml`: Production Compose stack for EC2 with `backend`, `frontend`, and `reverse-proxy` (Caddy with HTTPS).
*   `deploy/Caddyfile`: Reverse proxy config routing `/` to `frontend:3000` and `/api`, `/health` to `backend:5000` with automatic TLS.
*   `deploy/backend.env.example.txt`: Example backend environment file for production runtime.
*   `deploy/README.md`: Step-by-step EC2 deployment guide.

### 3.4. `shared`

The `shared` directory contains any shared types or utilities that are used by both the frontend and backend. *Currently, this directory is empty.*

## 4. Project-Wide Variables and Functions

This section provides a list of all the project-wide variables and functions, what they do, in which file they are defined, and which files use them.

### 4.1. Environment Variables

The following environment variables are used in the project. They should be defined in a `.env` file in the root of the `frontend` and `backend` directories.

#### Backend (`backend/.env`)

*   `PORT`: The port that the backend server will run on.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/src/index.ts`
*   `NODE_ENV`: The environment that the backend is running in (e.g., `development`, `production`).
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/src/index.ts`, `backend/src/middleware/errorHandler.ts`, `backend/src/models/database.ts`
*   `DB_HOST`: The hostname of the database server.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/knexfile.js`
*   `DB_PORT`: The port of the database server.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/knexfile.js`
*   `DB_NAME`: The name of the database.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/knexfile.js`
*   `DB_USER`: The username for the database.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/knexfile.js`
*   `DB_PASSWORD`: The password for the database.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/knexfile.js`
*   `DB_SSL`: Whether to use SSL for the database connection.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/knexfile.js`
*   `FRONTEND_URL`: The URL of the frontend application.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/src/index.ts`
*   `OPENAI_API_KEY`: The API key for the OpenAI API.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/src/services/aiService.ts`
*   `OPENAI_MODEL`: The OpenAI model to use for the chatbot.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/src/services/aiService.ts`
*   `OPENAI_CONTENT_FILTER`: Enables/disables OpenAI's built-in content filtering (`true`/`false`).
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/src/services/aiService.ts`
*   `OPENAI_ALLOW_EXPLICIT`: Allows the AI to generate explicit/adult content when appropriate (`true`/`false`).
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/src/services/aiService.ts`
*   `WHATSAPP_VERIFY_TOKEN`: The verify token for the WhatsApp webhook.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/src/routes/whatsapp.ts`
*   `WHATSAPP_ACCESS_TOKEN`: The access token for the WhatsApp API.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/src/services/whatsappService.ts`
*   `WHATSAPP_PHONE_NUMBER_ID`: The phone number ID for the WhatsApp API.
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/src/services/whatsappService.ts`
*   `WHATSAPP_TYPING_DELAY`: Enables/disables realistic typing delays for bot responses (`true`/`false`).
    *   **Defined in:** `backend/.env`
    *   **Used in:** `backend/src/utils/typingDelay.ts`

#### Frontend (`frontend/.env`)

*   `NEXT_PUBLIC_API_URL`: The URL of the backend API.
    *   **Defined in:** `frontend/.env`
    *   **Used in:** `frontend/src/utils/api.ts`
*   `CUSTOM_KEY`: An example of a custom environment variable.
    *   **Defined in:** `frontend/.env`
    *   **Used in:** `frontend/next.config.js`

## 8. Docker Self-Hosting

### 8.1. Overview

The project ships with Docker support to self-host both services:

- Frontend (Next.js) exposed on port 3000
- Backend (Express) exposed on port 5000

### 8.2. Files

- `docker-compose.yml`: Orchestrates both services
- `Dockerfile` (root): Builds the Next.js app (frontend)
- `backend/Dockerfile`: Builds the Node.js backend
- `frontend/.dockerignore`, `backend/.dockerignore`: Optimize Docker context

### 8.3. Environment Variables

Use a `.env` file in the project root (not committed) to provide secrets:

```
# Frontend will talk to backend via service name inside the compose network
NEXT_PUBLIC_API_URL=http://backend:5000
NEXT_PUBLIC_SOCKET_URL=http://backend:5000

# Backend
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# Optional DB settings (Postgres in production). Defaults use SQLite file volume
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_SSL=false
```

### 8.4. Build & Run

Run the stack on ports 3000 (frontend) and 5000 (backend):

```
docker compose build ; docker compose up -d
```

Access:

- Frontend: http://localhost:3000
- Backend health: http://localhost:5000/health

### 8.5. Volumes & Data

- `backend-data` volume stores the SQLite DB under `/app/database` inside the backend container.

### 8.6. Notes

- In Docker, frontend uses `http://backend:5000` to access the API via Compose DNS.
- For local dev outside Docker, it will fall back to `http://localhost:5000`.

### 8.7. AWS EC2 Production Deployment

- **Location**: See `deploy/`.
- **Requirements**: A domain pointing to EC2, ports 80/443 open, Docker installed.
- **Quick start (on EC2)**:

```
cd WhatsappBot/deploy
Copy .\backend.env.example.txt .\backend.env ; Copy .\.env.prod.example .\.env.prod
# Edit .env.prod: DOMAIN, PUBLIC_ORIGIN, ACME_EMAIL, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL
docker compose -f docker-compose.prod.yml --env-file .env.prod build ; docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

- **Services**:
  - `reverse-proxy`: Caddy terminating TLS for `${DOMAIN}`
  - `frontend`: Next.js (port 3000, internal)
  - `backend`: Express API (port 5000, internal) with SQLite volume `backend-data`

- **Public URLs**:
  - Frontend: `https://${DOMAIN}`
  - API: `https://${DOMAIN}/api`
  - Health: `https://${DOMAIN}/health`

### 4.2. Functions

This section provides a list of the most important functions in the project, what they do, in which file they are defined, and which files use them.

#### Backend

*   **`asyncHandler`**
    *   **Description:** A higher-order function that wraps async route handlers and passes any errors to the error handling middleware. This avoids the need for a `try...catch` block in every async route handler.
    *   **Defined in:** `backend/src/middleware/errorHandler.ts`
    *   **Used in:**
        *   `backend/src/routes/appointments.ts`
        *   `backend/src/routes/bot.ts`
        *   `backend/src/routes/calendar.ts`
        *   `backend/src/routes/whatsapp.ts`
*   **`generateTimeSlots`**
    *   **Description:** A utility function that generates all possible appointment slots for a given day based on the weekly schedule.
    *   **Defined in:** `backend/src/utils/calendarUtils.ts`
    *   **Used in:**
        *   `backend/src/routes/calendar.ts`
        *   `backend/src/routes/appointments.ts`
*   **`isBlackoutDate`**
    *   **Description:** A utility function that checks if a given date falls on a blackout day.
    *   **Defined in:** `backend/src/utils/calendarUtils.ts`
    *   **Used in:**
        *   `backend/src/routes/calendar.ts`
        *   `backend/src/routes/appointments.ts`
*   **`TypingDelayService.calculateTypingDelay`**
    *   **Description:** Calculates realistic typing delay based on message length (2.5 chars/second) plus random delay (4-15 seconds).
    *   **Defined in:** `backend/src/utils/typingDelay.ts`
    *   **Used in:**
        *   `backend/src/utils/typingDelay.ts` (internal)
*   **`TypingDelayService.applyTypingDelay`**
    *   **Description:** Calculates and applies realistic typing delay for bot responses to simulate human-like response timing.
    *   **Defined in:** `backend/src/utils/typingDelay.ts`
    *   **Used in:**
        *   `backend/src/services/whatsappService.ts`
        *   `backend/src/routes/bot.ts`
*   **`TypingDelayService.delay`**
    *   **Description:** A utility function that creates a Promise-based delay for a specified number of milliseconds.
    *   **Defined in:** `backend/src/utils/typingDelay.ts`
    *   **Used in:**
        *   `backend/src/utils/typingDelay.ts` (internal)
*   **`whatsappService.handleIncomingMessage`**
    *   **Description:** Processes incoming WhatsApp messages with full workflow: stores user message, generates AI response, applies typing delay, sends to WhatsApp, manages draft/sent status.
    *   **Defined in:** `backend/src/services/whatsappService.ts`
    *   **Used in:**
        *   `backend/src/routes/whatsapp.ts`
*   **`whatsappService.handleTestMessage`**
    *   **Description:** Processes test chat messages with identical logic to WhatsApp (user message storage, AI response generation, typing delay, draft/sent status) but without sending to WhatsApp.
    *   **Defined in:** `backend/src/services/whatsappService.ts`
    *   **Used in:**
        *   `backend/src/routes/bot.ts`

#### Frontend

*   **`useApi`**
    *   **Description:** A custom React hook that provides a convenient way to make API requests and manage loading and error states. It returns an `execute` function that can be called to trigger the API request.
    *   **Defined in:** `frontend/src/hooks/useApi.ts`
    *   **Used in:**
        *   `frontend/src/components/BotConfigForm.tsx`
*   **`useFetch`**
    *   **Description:** A custom React hook that is built on top of `useApi`. It automatically fetches data when the component mounts and when the dependencies change. It also returns a `refetch` function that can be called to manually re-trigger the API request.
    *   **Defined in:** `frontend/src/hooks/useApi.ts`
    *   **Used in:**
        *   `frontend/src/components/Calendar.tsx`
        *   `frontend/src/components/BotConfigForm.tsx`

## 5. Advanced Bot Configuration System

### 5.1. Configuration Fields

The enhanced bot configuration system provides comprehensive customization options:

#### Bot Identity
*   **Bot Name**: Custom name for the AI assistant (e.g., "Dr. Schmidt's Assistent")
*   **Bot Description**: Detailed description of the bot's purpose and role

#### Personality & Tonality
*   **Personality Tone**: Nine different communication styles:
    *   Professional: Formal and business-like
    *   Friendly: Warm and welcoming  
    *   Casual: Relaxed and informal
    *   Flirtatious: Charming and playful
    *   Direct: Clear and to the point
    *   Emotional: Empathetic and understanding
    *   Warm: Caring and supportive
    *   Confident: Self-assured and competent
    *   Playful: Humorous and light
*   **Character Traits**: Customizable personality characteristics

#### Services & Background
*   **Background Information**: What the bot should know about itself
*   **Services Offered**: Detailed list of available services and capabilities
*   **Escalation Rules**: Conditions for human-in-the-loop handover
*   **Bot Limitations**: Clear boundaries of what the bot cannot/should not do

### 5.2. System Prompt Generation

The system automatically generates comprehensive system prompts from the configuration fields using the `generateSystemPrompt` function:

*   **Structure**: Organized sections for personality, background, services, rules, and behavior
*   **Dynamic Content**: Automatically incorporates all configuration values
*   **Live Preview**: Real-time preview of generated prompt in the configuration interface
*   **Validation**: Ensures all critical information is included

### 5.3. Database Schema Extensions

The `bot_configs` table has been extended with the following fields:

*   `bot_name`: VARCHAR - Custom bot name
*   `bot_description`: TEXT - Bot description and purpose
*   `personality_tone`: ENUM - Selected personality tone
*   `character_traits`: TEXT - Character traits description
*   `background_info`: TEXT - Background information
*   `services_offered`: TEXT - Available services
*   `escalation_rules`: TEXT - Human handover conditions
*   `bot_limitations`: TEXT - Bot boundaries and restrictions
*   `generated_system_prompt`: TEXT - Auto-generated system prompt

### 5.4. Configuration Interface

The `BotConfigForm` component provides:

*   **Sectioned Layout**: Organized into logical groups (Identity, Personality, Services, Rules)
*   **Real-time Updates**: Live generation of system prompts as fields change
*   **Preview Functionality**: Expandable preview of the generated system prompt
*   **Validation**: Form validation and error handling
*   **Auto-save**: Automatic prompt generation and storage

## 6. Services & Pricing Management

### 6.1. Service Management Features

The services management system allows comprehensive configuration of bot services and pricing:

#### Services Tab
*   **Tabbed Interface**: Separate tab in bot configuration for services management
*   **Service Table**: Professional table view showing services, prices, and durations
*   **CRUD Operations**: Create, Read, Update, Delete services with full form validation
*   **Multi-Currency Support**: EUR, USD, CHF currency options
*   **Service Details**: Name, description, price, duration, and sorting options

#### Service Data Structure
*   **Service Name**: Display name for the service
*   **Description**: Optional detailed service description  
*   **Price & Currency**: Decimal pricing with currency selection
*   **Duration**: Optional appointment duration in minutes
*   **Sort Order**: Custom ordering for service display
*   **Active Status**: Enable/disable services without deletion

### 6.2. Database Schema

#### Services Table
*   `id`: UUID primary key
*   `bot_config_id`: Foreign key to bot_configs table
*   `name`: VARCHAR - Service name
*   `description`: TEXT - Optional service description
*   `price`: DECIMAL(10,2) - Service price
*   `currency`: VARCHAR - Currency code (EUR, USD, CHF)
*   `duration_minutes`: INTEGER - Optional duration
*   `is_active`: BOOLEAN - Soft delete flag
*   `sort_order`: INTEGER - Display ordering
*   `created_at`, `updated_at`: Timestamps

### 6.3. API Integration

#### Services API Endpoints
*   **GET /api/services/:botConfigId**: Retrieve all active services
*   **POST /api/services/:botConfigId**: Create new service
*   **PUT /api/services/:serviceId**: Update existing service
*   **DELETE /api/services/:serviceId**: Soft delete service

#### Frontend Integration
*   **Real-time Updates**: Immediate refresh after CRUD operations
*   **Form Validation**: Client-side validation with error handling
*   **Loading States**: Progressive loading and success feedback
*   **Responsive Design**: Mobile-friendly table and form layouts

### 6.4. User Experience Features

*   **Empty State**: Helpful guidance when no services exist
*   **Inline Editing**: Quick edit functionality with modal forms
*   **Price Formatting**: Automatic currency formatting with Intl.NumberFormat
*   **Confirmation Dialogs**: Safety confirmations for delete operations
*   **Success Feedback**: Toast notifications for successful operations

## 7. Advanced Calendar Management System

### 7.1. Calendar Features

The calendar system provides comprehensive appointment and availability management:

#### Calendar View
*   **Interactive Calendar**: Built on `react-big-calendar` with German localization
*   **Multiple Views**: Month, Week, Day, and Agenda views
*   **Appointment Management**: Click to create/edit appointments, drag-and-drop support
*   **Color-Coded Status**: Visual indicators for appointment status:
    *   Green: Confirmed appointments
    *   Yellow: Pending appointments  
    *   Red: Cancelled appointments
    *   Gray: Completed appointments
*   **Quick Actions**: New appointment button, appointment details modal
*   **Real-time Updates**: Automatic refresh after changes

#### Appointment Modal
*   **Customer Information**: Name, phone, email fields
*   **Appointment Details**: Date/time picker, duration, appointment type
*   **Appointment Types**: Consultation, Checkup, Follow-up, Treatment, Emergency
*   **Notes Field**: Additional information storage
*   **CRUD Operations**: Create, Read, Update, Delete appointments
*   **Validation**: Form validation with error handling

#### Availability Management
*   **Weekly Schedule**: Configure available days and time slots
*   **Multiple Time Slots**: Support for split schedules (e.g., morning/afternoon)
*   **Day-specific Settings**: Individual configuration per weekday
*   **Blackout Dates**: Block specific dates with optional reasons
*   **Real-time Preview**: Immediate visual feedback

### 7.2. Bot-Calendar Integration

The AI bot seamlessly integrates with the calendar system through tool functions:

#### Available Tools
*   **`checkAvailability`**: Bot can query available appointment slots
    *   Parameters: date, duration
    *   Returns: Array of available time slots
    *   Respects weekly schedule and blackout dates (uses active bot config)
*   **`bookAppointment`**: Bot can create new appointments
    *   Parameters: customerName, customerPhone, datetime, duration, notes
    *   Returns: Created appointment with confirmation
    *   Automatic status setting and validation (uses active bot config)

#### Integration Benefits
*   **Seamless Booking**: Customers can book directly through WhatsApp
*   **Real-time Availability**: Bot always has current availability data
*   **Automatic Updates**: Calendar updates immediately after bot bookings
*   **Conflict Prevention**: Built-in validation prevents double bookings
*   **Professional Workflow**: Appointments appear in calendar interface

## 6. Content Policy & Explicit Content

### 6.1. OpenAI Content Filtering Configuration

The bot supports configurable content filtering to allow for more open conversations when appropriate:

**Environment Variables:**
```bash
OPENAI_CONTENT_FILTER=false      # Disables built-in content filtering
OPENAI_ALLOW_EXPLICIT=true       # Allows explicit/adult content generation
```

**Important Considerations:**
*   **Legal Compliance**: Ensure compliance with local laws and regulations
*   **Age Verification**: Implement age checks for explicit content
*   **User Consent**: Always obtain explicit user consent for mature content
*   **Business Context**: Consider if explicit content aligns with your business goals
*   **WhatsApp ToS**: Verify compliance with WhatsApp's Terms of Service

**Example Usage:**
When `OPENAI_ALLOW_EXPLICIT=true`, the system prompt automatically includes:
```
CONTENT POLICY:
- Du kannst offen über alle Themen sprechen, einschließlich expliziter/erotischer Inhalte
- Achte darauf, dass der Nutzer volljährig ist (18+) bei expliziten Themen
- Verwende angemessene Sprache basierend auf dem Kontext
- Respektiere immer Grenzen und Einverständnis
```

**Recommended Settings by Use Case:**
*   **Business/Professional**: `OPENAI_ALLOW_EXPLICIT=false`
*   **Healthcare/Therapy**: `OPENAI_CONTENT_FILTER=false`, `OPENAI_ALLOW_EXPLICIT=false`
*   **Adult Entertainment**: `OPENAI_CONTENT_FILTER=false`, `OPENAI_ALLOW_EXPLICIT=true`
*   **Personal Assistant**: Based on user preference

## 7. Docker Deployment

The application supports Docker containerization for easy deployment and self-hosting.

### 7.1. Docker Configuration Files

*   **`Dockerfile` (frontend)**: Multi-stage build for Next.js application with standalone output
*   **`backend/Dockerfile`**: Node.js backend with TypeScript compilation and database migrations
*   **`docker-compose.yml`**: Orchestrates frontend, backend, and database services
*   **`.dockerignore`**: Excludes unnecessary files from Docker builds

### 7.2. Deployment Commands

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild after code changes
docker compose build
docker compose up -d
```

### 7.3. Technical Implementation

#### Database Schema
*   **Appointments Table**: Customer data, scheduling information, status tracking
*   **Availability Configs**: Weekly schedules, time slots, settings
*   **Blackout Dates**: Date-specific availability blocking

#### API Integration
*   **Calendar API**: Overview statistics, availability checking
*   **Appointments API**: Full CRUD operations for appointment management
*   **Real-time Sync**: Frontend and bot share same data source

#### Component Architecture
*   **Tabbed Interface**: Separate views for calendar and availability
*   **Modal System**: Overlay interface for appointment management  
*   **State Management**: React hooks for data synchronization
*   **Error Handling**: Comprehensive error states and user feedbacknp