+++
title = 'I Made a Blog'
date = 2025-05-11
draft = false
tags = ['hugo', 'blog', 'github-actions', 'cloudflare-pages', 'pulumi']
categories = ['web', 'personal-development']
+++
I wanted a place that I could document configuration, processes, and solutions for future reference. A blog seems like a good enough place for that. The general idea is to have a markdown based blog that I could edit in something like Obsidian, push the changes with git, and have it automatically deploy.

The end result lives at [github.com/rfhold/blog](https://github.com/rfhold/bloge)

## Overview

Based on experience with these tools and nothing better popping out as a new option. I'm going with the following:
- Cloudflare Pages for deployment
- Hugo and Papermod for the static site generation
- Pulumi IAC for creating
	- Cloudflare pages project
	- Cloudflare pages domain
	- Cloudflare dns record
	- GitHub Actions Cloudflare api token secret
	- GitHub actions Cloudflare Account ID
- GitHub Actions to run Hugo Build then Wrangler for Pages deploy

### Cloudflare Pages

I chose [Cloudflare Pages](https://developers.cloudflare.com/pages/) because I already use them for my domain names, and I wanted a simple fast deployment that limits my attack surface. The IaC is less than 50 lines of code, the workflow is boilerplate plus `npx wrangler pages deploy` and a few lines in the `wrangler.toml`, and It's extendable if I want to add and server side code.

#### Pulumi IaC
I use [Pulumi](https://www.pulumi.com/docs/iac/) for my IaC, I've not experienced many instances where terraform could do something that Pulumi could not. Glossing over it's setup, here is the typescript code for it.

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as github from "@pulumi/github";

const cloudflareApiToken = new pulumi.Config("cloudflare").requireSecret("apiToken");
const accountId = new pulumi.Config("cloudflare-cfg").require("accountId");
const repo = new pulumi.Config("github-cfg").require("repo");

const project = new cloudflare.PagesProject("rholden-dev", {
	name: "rholden-dev",
	accountId: accountId,
	productionBranch: "main",
});

const pagesDomain = new cloudflare.PagesDomain("rholden.dev", {
	projectName: project.name,
	accountId: accountId,
	name: "rholden.dev",
});

const zone = cloudflare.getZoneOutput({
	filter: {
		name: "rholden.dev",
	},
});

pulumi.all([zone.zoneId]).apply(([zoneId]) => {
	if (zoneId === "" || zoneId === undefined) {
		throw new Error("Zone not found");
	}

	new cloudflare.DnsRecord("rholden.dev", {
		name: pagesDomain.name,
		type: "CNAME",
		proxied: true,
		zoneId,
		content: project.subdomain,
		ttl: 1,
	});
});

new github.ActionsSecret("CLOUDFLARE_API_TOKEN", {
	repository: repo,
	plaintextValue: cloudflareApiToken,
	secretName: "CLOUDFLARE_API_TOKEN",
});

new github.ActionsVariable("CLOUDFLARE_ACCOUNT_ID", {
	repository: repo,
	value: accountId,
	variableName: "CLOUDFLARE_ACCOUNT_ID",
});
```

#### Github Actions and Wrangler

The `wrangler.toml` is 2 lines of glorious configuration. The `public` folder is where Hugo outputs it's static assets. Detailed in the [Cloudflare Pages Functions Configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/#example-wrangler-file) docs
```toml
name = "rholden-dev"
pages_build_output_dir = "public"
```

This GitHub Actions workflow (including Hugo build) deploys to main on every push.

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: "Checkout code"
        uses: actions/checkout@v4
      
      - name: "Set up Go"
        uses: actions/setup-go@v4
        with:
          go-version: '1.24'

      - name: "Build with Hugo"
        run: |
          go run github.com/gohugoio/hugo@latest

      - name: "Deploy with Bun deploy script"
        env: 
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          npx wrangler pages deploy
```

### Hugo

I decided to go with [Hugo](https://gohugo.io/) for it's large community support and development experience. Their docs (and whatever theme you might choose) would do a better job of explaining the setup process. I chose [PaperMod](https://github.com/adityatelange/hugo-PaperMod) for my theme.