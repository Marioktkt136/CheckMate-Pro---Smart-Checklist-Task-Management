# Security Specification

## Data Invariants
1. A checklist item must have a valid `id`, non-empty `titleAr` (<= 150 chars), and a valid `folderId`.
2. A project must have a valid `id`, `nameAr` (<= 100 chars), and non-negative `budget`.
3. Document IDs must adhere to standard alphanumeric and hyphen/underscore characters (`^[a-zA-Z0-9_\\-]+$`).

## Verification
- Rules enforce default-deny across all unmapped collections.
- Size and type safety guards protect against oversized payload injections.
- Authentication checks restrict create, update, and delete mutations.
