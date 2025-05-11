import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as github from "@pulumi/github";

const cloudflareToken = new pulumi.Config("cloudflare").requireSecret("apiToken");
const cloudflareCfg = new pulumi.Config("cloudflare-cfg");

const accountId = cloudflareCfg.require("accountId");

const project = new cloudflare.PagesProject("rholden-dev", {
	name: "rholden-dev",
	accountId: accountId,
	productionBranch: "main",
});

const githubCfg = new pulumi.Config("github-cfg");
const repo = githubCfg.require("repo");

const secret = new github.ActionsSecret("CLOUDFLARE_API_TOKEN", {
	repository: repo,
	plaintextValue: cloudflareToken,
	secretName: "CLOUDFLARE_API_TOKEN",
});

const accountVariable = new github.ActionsVariable("CLOUDFLARE_ACCOUNT_ID", {
	repository: repo,
	value: accountId,
	variableName: "CLOUDFLARE_ACCOUNT_ID",
});

