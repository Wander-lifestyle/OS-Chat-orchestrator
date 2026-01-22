# Light DAM

Light DAM is a lightweight digital asset manager designed for small marketing teams
who need a fast, searchable library of images (20-50 assets, not thousands). It uses
Cloudinary as the single source of truth for storage, metadata, previews, and download
links.

## Features

- Natural language search over tags, metadata, and filenames
- Image previews and one-click downloads
- Metadata-driven organization (photographer, usage rights, campaign, asset number)
- Upload UI with metadata form (asset #, campaign, photographer, usage rights)
- Optional AI auto-tagging and AI search mode
- Drag-and-drop + multi-upload support
- AI tag confidence display (when returned by Cloudinary)
- Optional folder scoping for multi-team libraries

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

## Environment Variables

Create a `.env.local` file or configure these in Vercel:

| Variable | Description | Required |
|----------|-------------|----------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `CLOUDINARY_FOLDER` | Optional folder scope for assets | No |
| `CLOUDINARY_AUTO_TAGGING_THRESHOLD` | Auto-tagging confidence (0.1-0.95) | No |

## How It Works

1. The UI calls `GET /api/dam/search?q=...`
2. The API queries Cloudinary for the latest assets
3. Results are filtered by the search query (tags, metadata, filenames, IDs)
4. The UI renders previews and download links
5. Uploads go directly to Cloudinary using a signed upload signature (supports larger files).

## Metadata Conventions

Light DAM reads metadata from either Cloudinary **context** or **structured metadata**.
Populate any of these fields to power searching and UI labels:

- `asset_id` (for image number searches)
- `photographer`
- `usage_rights`
- `campaign`
- `description` / `caption`

### Example: Uploading with Context

```bash
curl -X POST \
  -F file=@hero.jpg \
  -F upload_preset=your_preset \
  -F context="asset_id=1234|photographer=Alex Rivera|usage_rights=Global paid social|campaign=Spring Launch" \
  "https://api.cloudinary.com/v1_1/<cloud-name>/image/upload"
```

## Search Tips

- Search by image number: `image #1234`
- Search by photographer: `photographer Alex`
- Search by campaign name or tag: `spring launch`
- Toggle **AI search** for broader semantic matches (uses tags + metadata)

> Note: AI auto-tagging requires the Cloudinary Auto-Tagging add-on.

## Deployment

Deploy to Vercel as a standard Next.js app. Add the Cloudinary environment variables
in Project Settings.
