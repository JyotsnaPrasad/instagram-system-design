# instagram-system-design
Instagram-like social media system design using AI-assisted development

- [REQUIREMENTS.md](REQUIREMENTS.md): functional requirements, edge cases, acceptance criteria
- [ARCHITECTURE.md](ARCHITECTURE.md): modules, schema, REST API, feed logic

## Backend

Requires Java 17+. From `backend/`:

```bash
./mvnw spring-boot:run   # API on http://localhost:8080, data in backend/data/
./mvnw test              # run the test suite
```

On first start the database is seeded with three demo users (alice, bob, carol).
Send `X-Acting-User: u1` (or `u2`, `u3`) on requests to act as a user, and
`POST /api/demo/reset` to restore the demo data.
