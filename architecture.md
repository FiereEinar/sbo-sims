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
- **Models that REQUIRE Term Context:** `Student`, `Transaction`, `Category`, `Prelisting`, `Event`, and `PaymentRequest` are all bound to a specific term. You **must** supply `semester` and `schoolYear` (derived from `req.tenantContext` or `req.currentUser`) when creating or querying these records.
- **Models that DO NOT REQUIRE Term Context:** Some models inherently inherit their term context via relationships. For example, `EventSession` or `AttendanceRecord` belong to an `Event`. Since the parent `Event` already has `semester` and `schoolYear` properties, you do not need to duplicate these fields on the child models. You only need to scope by the parent ID.
- **`PaymentRequest` is scoped by the student's active term:** When a student creates a payment request, the `semester` and `schoolYear` fields are taken from `req.currentUser.activeSemDB` / `activeSchoolYearDB` (the student's currently selected term), **not** from the enrollment `Student` record. This ensures requests belong to the term the student was viewing when they submitted them.

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

---

## 6. Student Portal

The Student Portal is a separate, restricted zone of the application for users with `role === 'student'`. It operates under a **different context model** than the org-admin routes.

### Key Differences from Org-Admin Routes:

| Concern | Org-Admin Routes | Student Portal Routes |
|---|---|---|
| Auth middleware | `auth` | `auth` + `studentAuth` |
| Org context | `extractTenantContext` (via `x-organization-slug` header) | None — students don't belong to a single org |
| Term context | `req.tenantContext.semester` / `schoolYear` | `req.currentUser.activeSemDB` / `activeSchoolYearDB` |
| Update active term | `PUT /user/:id` (requires org context) | `PUT /student-portal/term` (no org context needed) |

### Student Multi-Org Enrollment:
A student user can appear in the `Student` collection of **multiple organizations** (e.g., enrolled in CS dept org and university-wide org simultaneously). Their `studentID` is the shared key. When fetching student data, always query across all `Student` records that match `{ studentID }` and collect their `_id` ObjectIds to use in queries.

### Payment Requests (Student-Submitted):
- Stored in `PaymentRequest` model, which includes `semester` and `schoolYear` fields.
- On creation, `semester`/`schoolYear` come from `req.currentUser.activeSemDB` / `activeSchoolYearDB`.
- On retrieval (both student and admin), records are filtered by the active term.
- Approving a request automatically creates a `Transaction` record.
- File uploads (receipt images) are **disabled in production** (Vercel has a read-only filesystem). The feature is locally available for testing. The `upload` middleware (using `multer`) uses memory storage in production and disk storage locally.
