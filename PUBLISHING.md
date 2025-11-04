# Publishing Guide

## Prerequisites

1. Node.js >= 14.0.0
2. Redis server running (for testing)
3. NPM account (for publishing)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Update Package Information

Edit `package.json` and update:
- `author`: Your name/email
- `repository.url`: Your GitHub repository URL
- `bugs.url`: Your GitHub issues URL
- `homepage`: Your GitHub repository homepage

### 3. Build the Project

```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` directory.

### 4. Test the Build

Make sure the `dist/` directory contains:
- `index.js` (main entry point)
- `index.d.ts` (TypeScript definitions)
- All other compiled files

### 5. Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: ratelimit-ts library"
```

### 6. Create GitHub Repository

1. Go to GitHub and create a new repository named `ratelimit-ts`
2. Add the remote:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ratelimit-ts.git
   git branch -M main
   git push -u origin main
   ```

### 7. Update README

Update the README.md to replace `YOUR_USERNAME` with your actual GitHub username in:
- Support section
- Badge URLs (if using)

### 8. Publish to NPM

**First time publishing:**
```bash
npm login
npm publish
```

**Subsequent versions:**
```bash
npm version patch  # or minor, or major
npm publish
```

## Testing Before Publishing

### Local Testing

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Test with a local Redis instance:
   ```bash
   # Start Redis (if not running)
   redis-server

   # Run example
   npx ts-node examples/basic-usage.ts
   ```

### Testing the Published Package Locally

You can test the package locally before publishing:

```bash
npm pack
# This creates a .tgz file
# Install it in another project:
npm install /path/to/ratelimit-ts-1.0.0.tgz
```

## Version Management

- `npm version patch` - Bug fixes (1.0.0 -> 1.0.1)
- `npm version minor` - New features (1.0.0 -> 1.1.0)
- `npm version major` - Breaking changes (1.0.0 -> 2.0.0)

## Important Notes

- The `prepublishOnly` script automatically builds before publishing
- Only files listed in `package.json` `files` field will be published
- Make sure `.npmignore` excludes source files (only `dist/` should be published)
- Update version in `package.json` before publishing new versions

