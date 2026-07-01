# SBO-SIMS System Architecture & Developer Guide

Welcome to the architectural overview and coding guidelines for the SBO-SIMS project. This document outlines the core patterns and standards necessary to maintain consistency, performance, and security across this multi-tenant system.

---

## 1. Multi-Tenant Context (Organization Scoping)

SBO-SIMS is fundamentally a multi-tenant application where data is strictly isolated per organization. 

### Best Practices:
- **Always Apply Organization Context:** Nearly every database query or mutation **must** include the organization filter to prevent data leaking across tenants. 
- **The `req.tenantContext` Object:** We use the `extractTenantContext` middleware to parse incoming headers (`x-organization-slug`) and resolve them into a proper database ObjectId. 
- **Example Usage:**
  ```typescript
  // DO NOT DO THIS
  const records = await StudentModel.find({ status: 'Active' }); 
  
  // ALWAYS DO THIS
  const records = await StudentModel.find({ 
    status: 'Active',
    organization: req.tenantContext!.organizationId 
  });
  ```

---

## 2. Term-based Data Scoping (Semester & School Year)

Data is not just isolated by organization, but often temporally isolated by the academic term. 

### Best Practices for Semestral Models:
- **Models that REQUIRE Term Context:** `Student`, `Transaction`, `Category`, `Prelisting`, and `Event` are all bound to a specific term. You **must** supply `semester` and `schoolYear` (derived from `req.tenantContext`) when creating or querying these records.
- **Models that DO NOT REQUIRE Term Context:** Some models inherently inherit their term context via relationships. For example, `EventSession` or `AttendanceRecord` belong to an `Event`. Since the parent `Event` already has `semester` and `schoolYear` properties, you do not need to duplicate these fields on the child models. You only need to scope by the parent ID.

---

## 3. Handling Massive Data (Optimized GET Endpoints)

As organizations grow, tables like Students and Transactions will accumulate thousands of rows per term. It is critical to optimize `GET` endpoints to prevent server memory bloat and slow client-side rendering.

### Optimization Practices:
- **Server-Side Pagination:** Never return an entire collection. Always utilize `skip()` and `limit()` on list endpoints.
- **Aggregation Pipelines & $facet:** For dashboard metrics and reports, rely on MongoDB's aggregation pipelines. Using `$facet` allows you to retrieve multiple analytics in a single database round-trip, significantly lowering overhead.
- **Lean Queries:** Use `.lean()` where appropriate on mongoose queries to return plain JavaScript objects instead of heavy Mongoose documents, reducing processing time and memory usage.

---

## 4. Authentication & RBAC (Role-Based Access Control)

SBO-SIMS utilizes a two-tiered permission system that combines high-level "macro-roles" with granular organizational RBAC.

### Macro-Roles (Context Segregation):
Defined in the `UserModel`, the `role` field dictates the overarching domain of the user:
- `central-admin`: Global system administrators managing organizations at `/admin`.
- `org-admin`: Core administrators inside an organization.
- `student`: Regular students logging in to view their personal data (Student Portal).

### Granular RBAC (Module Permissions):
- For `org-admin` users, their exact capabilities are mapped out via an `rbacRole` reference pointing to the `RoleModel`.
- **Route Protection:** Use the `hasRole([MODULES.SOME_ACTION])` middleware on endpoints. The system will automatically parse the user's assigned RBAC permissions and allow/deny the request.
- **Role Self-Healing:** The system natively checks for missing module permissions or mismatched roles upon login. Do not bypass this; let the authentication controller handle role self-healing if you introduce new modules to the system.

---

## 5. Additional System Practices

- **Express Async Handler:** Always wrap your controller functions in `asyncHandler(async (req, res) => { ... })`. This automatically catches unhandled promise rejections and forwards them to the global error handler, keeping the app crash-resilient.
- **App Assertions:** Use the custom `appAssert(condition, HTTP_CODE, message)` utility instead of manually throwing errors or writing nested `if(!resource)` blocks. It keeps controllers flat and readable.
- **Soft Deletion:** Prefer "archiving" records over hard deletion where relational integrity matters. Models like `Event` use an `archived: boolean` flag so past data isn't unexpectedly wiped from dependent records.
