---
id: help
type: guide
title: Getting Started
links:
  - rel: related_to
    target: index
  - rel: related_to
    target: flights-search
  - rel: related_to
    target: airports
---

# Getting Started

This site is an MDH-enabled flight search API. Here's how to navigate it.

## Discovery

Start at `/` or `/md/index` to read this site's root page. Two artifacts describe the site structure:

- **nodes.json** — lists every page on this site with its ID, title, and type (`/mdh/nodes.json`)
- **actions.json** — lists API actions you can call (`/mdh/actions.json`)

## Navigation

Each page is a Markdown document at `/md/{name}`. Pages link to each other using standard markdown links. Follow the links to navigate between pages.

Read the frontmatter at the top of each page to see its `id`, `type`, and `links` (connections to other pages).

## Doing things

The [search flights](/md/flights-search) page describes the search action. It's a GET request — build the URL with query parameters and fetch it.

## Typical flow

1. Read `/` or `/md/index` for an overview
2. Read `/mdh/nodes.json` to see all pages
3. Read `/mdh/actions.json` to see available actions
4. Navigate to [search flights](/md/flights-search) to learn the search parameters
5. Call `GET /api/flights/search?from=ARN&to=BCN` to get results

See [airports](/md/airports) for valid airport codes and [flights](/md/flights) for available routes.
