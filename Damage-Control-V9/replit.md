# Logistics Damage Tracking Platform

## Overview
A comprehensive web application for managing and analyzing shipping damage tickets and general orders across multiple carriers (FedEx, USPS, UPS, OnTrac, DHL). The platform provides visual analytics, automated carrier detection, bulk import capabilities, and separate tracking for damaged items and all orders. The business vision is to streamline logistics operations, reduce manual data entry, and provide actionable insights into shipping damage trends and order fulfillment, ultimately improving supply chain efficiency and customer satisfaction.

## User Preferences
I want to use simple and clear language. I prefer iterative development. Ask before making major changes. I prefer detailed explanations. Do not make changes to the `server/storage.ts` file, as it is slated for replacement.

## System Architecture

### UI/UX Decisions
The platform features a clean, responsive design optimized for mobile, tablet, and desktop.
- **Color Palette**: Background `#e5dbcc` (Beige), Primary `#9caf88` (Olive Green), Card `#ffffff` (White), Text `#000000` (Black).
- **Typography**: Inter font family, bold headings, regular body text.
- **Spacing**: Consistent padding (p-4, p-6, p-8) and component spacing (gap-4, gap-6, space-y-4, space-y-6).
- **Navigation**: Tabbed interface to switch between "Avarias" (Damages) and "Pedidos" (Orders) with a consistent layout.

### Technical Implementations
- **Carrier Auto-Detection**: Automatically identifies carriers based on tracking number prefixes for both damage tickets and orders.
- **Bulk Import**: Supports CSV and XLSX files with preview, validation, and error reporting for both damage tickets and orders.
- **Data Visualization**: Interactive charts (bar, pie, line) for KPI dashboards.
- **Data Entry**: Forms with automatic field population, validation, and rich text observations.
- **Independent Data**: Separate storage and analytics for damage tickets and orders.

### Feature Specifications

#### Damage Tracking (Avarias)
- **Dashboard**: KPI cards, interactive charts (carrier, damage type, time), recent tickets table, filters (carrier, damage type), CSV export.
- **Data Entry**: Manual form with auto-carrier detection, multi-select damage types, URL validation, editable timestamp, rich observations.

#### Orders Management (Pedidos)
- **Dashboard**: KPI cards, interactive charts (carrier, product distribution), recent orders table, filters (carrier, product), bulk delete.
- **Import**: Simplified import with tracking number, order number, and product.

### System Design Choices
- **Technology Stack**: React + TypeScript + Vite (frontend), Express.js + Node.js (backend), Shadcn/ui + Radix UI (components), Tailwind CSS (styling), Recharts (charts), React Hook Form + Zod (forms), TanStack Query (data fetching), Wouter (routing).
- **Storage**: Currently uses **in-memory storage** (`MemStorage`) for tickets and orders. **Note**: This is a placeholder; persistent storage (e.g., PostgreSQL with Drizzle ORM) is recommended for production.
- **API Endpoints**: RESTful API with JSON request/response format for tickets and orders (GET, POST, PATCH, DELETE). Schemas defined in `shared/schema.ts`.
- **Data Models**:
    - **Ticket**: `id`, `ticketId`, `orderNumber`, `trackingNumber`, `carrier`, `ticketUrl`, `damageTypes`, `dateReported`, `observations`, `notes`.
    - **Order**: `id`, `trackingNumber`, `orderNumber`, `produto`, `carrier`, `dateImported`.
- **Code Quality**: Full TypeScript coverage, shared schemas, Zod validation, robust error handling, `data-testid` attributes for E2E testing.

### Deployment Architecture
- **Development**: Uses traditional Express server in `server/` directory with hot reload
- **Production (Vercel)**: 
  - Frontend: Static build served from `dist/public`
  - Backend: Serverless functions in `api/` directory
  - All API routes prefixed with `/api` are handled by serverless functions
  - Client-side routing handled via rewrites to `index.html`
  - Configuration in `vercel.json` with optimized memory (1024MB) and timeout (10s)
- **Deploy Instructions**: See `DEPLOY_VERCEL.md` for complete deployment guide

## External Dependencies
- **Frontend Framework**: React
- **Backend Runtime**: Node.js
- **UI Libraries**: Shadcn/ui, Radix UI
- **Styling Framework**: Tailwind CSS
- **Charting Library**: Recharts
- **Form Management**: React Hook Form
- **Validation Library**: Zod
- **Data Fetching Library**: TanStack Query (React Query)
- **Routing Library**: Wouter
- **CSV Parsing**: PapaParse
- **XLSX Parsing**: SheetJS/xlsx