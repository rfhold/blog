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

new github.ActionsSecret("CLOUDFLARE_ACCOUNT_ID", {
	repository: repo,
	plaintextValue: accountId,
	secretName: "CLOUDFLARE_ACCOUNT_ID",
});

