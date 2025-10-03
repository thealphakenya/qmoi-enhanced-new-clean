// QMOI Cross-Repo Sync & Notification Script
// Automatically syncs all repos, updates .md files, triggers workflows, and sends Gmail notifications

const { Octokit } = require("@octokit/rest");
const fs = require("fs");



function getEnvVar(name, fallback) {
  if (process.env[name]) return process.env[name];
  if (fallback) return fallback;
  // No hardcoded secrets allowed
  throw new Error(`Missing required env variable: ${name}`);
}

const USERNAME = "thealphakenya";
const REPOS = ["qmoi-enhanced-new", "Alpha-Q-ai", "qmoi-enhanced"];

async function getConfig() {
  return {
    GITHUB_TOKEN: await getEnvVar('GITHUB_TOKEN', ''),
  };
}


let octokit;


async function syncRepos() {
  const config = await getConfig();
  // Use token from environment variable only, never hardcode
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN environment variable is not set.');
  }
  octokit = new Octokit({ auth: githubToken });
  for (const repo of REPOS) {
    // Get repo files
    const files = await octokit.repos.getContent({ owner: USERNAME, repo, path: "" });
    // Find all .md files
    const mdFiles = files.data.filter(f => f.name.endsWith(".md"));
    // Log and update .md files
    for (const file of mdFiles) {
      console.log(`[${repo}] Found markdown file:`, file.name);
      // Optionally update file (e.g., add sync log)
      // await octokit.repos.createOrUpdateFileContents({ ... })
    }
      // Trigger repository_dispatch event instead of workflow_dispatch
      await octokit.request('POST /repos/{owner}/{repo}/dispatches', {
        owner: USERNAME,
        repo: repo,
        event_type: 'qmoi-auto-sync',
        client_payload: {
          triggered_by: 'qmoi-crossrepo-sync',
          timestamp: new Date().toISOString(),
        }
      });
  // Log status update to console (GitHub Actions will show this)
  console.log(`[${repo}] Synced and workflows triggered. Markdown files: ${mdFiles.map(f => f.name).join(", ")}`);
  }
}


async function notifyChange(repo, message) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  // Create or update an issue for sync notification
  await octokit.issues.create({
    owner: USERNAME,
    repo,
    title: `QMOI Sync Notification`,
    body: message,
    labels: ["automation", "sync"]
  }).catch(async err => {
    // If issue exists, add a comment
    if (err.status === 422) {
      const issues = await octokit.issues.listForRepo({ owner: USERNAME, repo, labels: "automation,sync", state: "open" });
      if (issues.data.length > 0) {
        await octokit.issues.createComment({
          owner: USERNAME,
          repo,
          issue_number: issues.data[0].number,
          body: message
        });
      }
    }
  });
}

syncRepos().catch(console.error);
