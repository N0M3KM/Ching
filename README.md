# Ching

A lightweight showcase demonstrating GPT-6 Astra performance, guided by Specification Engineering.

Game-first Mandarin learning, targeting **0.0.1 pre-alpha**. No database, authentication, or server-side user persistence.

This repository starts with the specification's first milestone: **contracts and static content**. It is a tested foundation, not yet a playable app. React/Tailwind screens, NestJS routes, game engines, audio, and browser persistence are subsequent milestones.

## Run the foundation

Requires Node.js 24 or newer and npm. Node 24 is used in CI.

```sh
npm ci
npm run check
```

`check` runs lint, strict typechecking, unit tests, compilation, and seed validation. For content authoring, use `npm run content:validate`; for iterative tests, use `npm run test:watch`.

## Layout

- `packages/contracts`: framework-free types for API, games, content, local progress, and track difficulty.
- `packages/game-core`: the `GameEngine` extension interface; implementations follow in individual features.
- `apps/api/src/ports`: content, future progress, and TTS interfaces.
- `apps/api/src/adapters/static-content`: immutable JSON repository with startup validation.
- `apps/api/src/content/data`: versioned development seeds for three tracks.
- `apps/web/src/ports`: browser `ProgressStore` boundary; no storage implementation yet.
- `docs`: architecture decisions, content provenance, and implementation checklist.

Packages are private, source-first workspaces. Compilation checks the foundation and emits declarations; `dist` is not yet a deployable server or website. API/web build entry points will be introduced with those features.

Read [the supplied specification](docs/Ching-Specification.md), [the implementation plan](docs/implementation-plan.md), [architecture decisions](docs/architecture.md), and [content provenance](docs/content-provenance.md) before extending this foundation.

## Contributing

Use a short-lived feature branch and one feature per PR, Conventional Commits, and squash merge after CI and review. The initial branch is `feat/contracts-and-static-content`. Never introduce accounts, a database, or server-side user writes for 0.0.1.
