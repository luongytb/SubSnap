# Subscription Service Layer

This directory contains the service layer for subscription data management. The architecture is designed to be database-ready and easily extensible.

## Architecture

### Repository Pattern

The `SubscriptionRepository` interface defines the contract for all data operations:

- `getAll()` - Fetch all subscriptions
- `getById(id)` - Fetch a single subscription by ID
- `create(subscription)` - Create a new subscription
- `update(id, updates)` - Update an existing subscription
- `delete(id)` - Delete a subscription
- `bulkCreate(subscriptions)` - Create multiple subscriptions at once
- `bulkDelete(ids)` - Delete multiple subscriptions at once

### Current Implementation

`LocalStorageSubscriptionRepository` - Stores data in browser localStorage. This is the default implementation.

### Future Database Implementation

To switch to a database backend, create a new repository class implementing `SubscriptionRepository`:

```typescript
class DatabaseSubscriptionRepository implements SubscriptionRepository {
  async getAll(): Promise<Subscription[]> {
    // Fetch from your database (e.g., Prisma, Drizzle, etc.)
  }
  
  async create(subscription: Omit<Subscription, "id" | "createdAt">): Promise<Subscription> {
    // Insert into database
  }
  
  // ... implement other methods
}
```

Then set it as the default repository:

```typescript
import { setSubscriptionRepository } from "@/lib/services/subscription-service";

setSubscriptionRepository(new DatabaseSubscriptionRepository());
```

### Export/Import Service

The `export-import-service.ts` provides:

- `exportSubscriptions()` - Export all subscriptions to JSON format
- `importSubscriptions(jsonData, options)` - Import subscriptions from JSON
- `downloadFile()` - Helper to download files
- `readFileAsText()` - Helper to read file contents

The export format includes version information for future compatibility:

```json
{
  "version": "1.0.0",
  "exportDate": "2024-01-01T00:00:00.000Z",
  "subscriptions": [...]
}
```

## Migration Path

When adding authentication and database:

1. Create a new repository implementation (e.g., `DatabaseSubscriptionRepository`)
2. Add user context/authentication to repository methods
3. Update `getSubscriptionRepository()` to return the database repository based on environment
4. The UI layer (`useSubscriptions` hook) remains unchanged - no refactoring needed!

## Benefits

- **Separation of Concerns**: Data access logic is isolated from UI logic
- **Testability**: Easy to mock repositories for testing
- **Flexibility**: Switch storage backends without changing UI code
- **Future-Proof**: Ready for database, authentication, and multi-user support

