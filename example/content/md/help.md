---
id: "doc:help"
type: guide
title: Getting Started
links:
  - rel: related_to
    target: "doc:index"
  - rel: related_to
    target: "doc:flights-search"
  - rel: related_to
    target: "doc:airports"
---

# Getting Started

This site is an MDH-enabled flight search API. Here's how to navigate it.

## Discovery

Start at `/` or `/md/index` to read this site's root node. Two artifacts describe the site structure:

- **nodes.json** — lists every page on this site with its ID, title, and type (`/mdh/nodes.json`)
- **actions.json** — lists API actions you can call (`/mdh/actions.json`)

## Navigation

Each page is a Markdown document at `/md/{name}`. Pages link to each other using wikilinks like `[[doc:flights]]`, which resolves to the node's `md_url` from `nodes.json`.

Read the frontmatter at the top of each page to see its `id`, `type`, and `links` (outgoing edges to other pages).

## Doing things

The [[doc:flights-search]] page describes the search action. It's a GET request — build the URL with query parameters and fetch it.

## Typical flow

1. Read `/` or `/md/index` for an overview
2. Read `/mdh/nodes.json` to see all pages
3. Read `/mdh/actions.json` to see available actions
4. Navigate to [[doc:flights-search]] to learn the search parameters
5. Call `GET /api/flights/search?from=ARN&to=BCN` to get results

See [[doc:airports]] for valid airport codes and [[doc:flights]] for available routes.
