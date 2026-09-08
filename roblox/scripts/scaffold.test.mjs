/**
 * Validate Roblox scaffold + scoring formulas (Balance.json).
 * Run: node --test roblox/scripts/scaffold.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(root, '..');

function read(rel) {
    return readFileSync(path.join(root, rel), 'utf8');
}

function json(rel) {
    return JSON.parse(read(rel));
}

describe('Rojo project', () => {
    it('maps real DataModel services to existing paths', () => {
        const project = json('default.project.json');
        assert.equal(project.name, 'RascalRunways');
        assert.equal(project.tree.$className, 'DataModel');
        const paths = [
            project.tree.ReplicatedStorage.$path,
            project.tree.ServerScriptService.$path,
            project.tree.StarterPlayer.StarterPlayerScripts.$path,
            project.tree.ReplicatedFirst.$path
        ];
        for (const p of paths) {
            assert.ok(existsSync(path.join(root, p)), p);
        }
    });

    it('enables HttpService (real property, not a fake API)', () => {
        const project = json('default.project.json');
        assert.equal(project.tree.HttpService.$className, 'HttpService');
        assert.equal(project.tree.HttpService.$properties.HttpEnabled, true);
    });
});

describe('Balance + scoring', () => {
    const balance = json('src/ReplicatedStorage/Shared/Balance.json');

    function stylePoints(looks, rares, pickups) {
        const s = balance.scoring;
        return looks * s.lookPoints + rares * s.rarePoints + pickups * s.pickupPoints;
    }

    function racePoints(distanceStuds, looks, rares, place) {
        const s = balance.scoring;
        const placePts = s.placePoints[place - 1] || 0;
        return Math.floor(Math.max(0, distanceStuds)) + looks * s.lookStyleBonus + rares * s.rareStyleBonus + placePts;
    }

    function posePoints(q) {
        const clamped = Math.min(1, Math.max(0, q));
        return Math.floor(balance.scoring.poseMax * clamped);
    }

    function coinsForScore(total, isPremium) {
        let coins = Math.floor(total / balance.scoring.coinsDivisor);
        if (isPremium) coins = Math.floor(coins * (1 + balance.scoring.premiumCoinBonus));
        return coins;
    }

    it('keeps first-win budget under 2 minutes', () => {
        const t = balance.tutorial;
        const total = t.lobbySeconds + t.countdownSeconds + t.runSeconds + t.poseSeconds;
        assert.ok(total < balance.retention.firstWinTargetSeconds, `tutorial ${total}s`);
        assert.equal(t.winOnFinishLine, true);
        assert.equal(t.rareTarget, 1);
        assert.ok(t.lives >= 1);
    });

    it('scores a tutorial finish without pay-to-win knobs', () => {
        const looks = 2;
        const rares = 1;
        const pickups = 2;
        const style = stylePoints(looks, rares, pickups);
        const race = racePoints(90, looks, rares, 1);
        const pose = posePoints(0.7);
        const finish = balance.scoring.finishBonus;
        const total = style + race + pose + finish;
        assert.equal(style, 2 * 25 + 1 * 120 + 2 * 40);
        assert.equal(race, 90 + 20 + 50 + 300);
        assert.equal(pose, 140);
        assert.equal(finish, 500);
        assert.equal(total, 1350);
        assert.equal(coinsForScore(total, false), 67);
        assert.equal(coinsForScore(total, true), 83);
    });

    it('does not encode score multipliers on passes', () => {
        const blob = JSON.stringify(balance);
        assert.equal(blob.includes('passScoreMult'), false);
        assert.equal(blob.includes('p2w'), false);
        assert.ok(balance.scoring.premiumCoinBonus <= 0.25);
    });
});

describe('Luau uses real Roblox APIs', () => {
    const files = [
        'src/ServerScriptService/Services/MonetizationService.lua',
        'src/ServerScriptService/Services/DataService.lua',
        'src/ServerScriptService/Services/SocialHookService.lua',
        'src/StarterPlayer/StarterPlayerScripts/Controllers/ShareController.lua',
        'src/ReplicatedStorage/Shared/Config.lua'
    ].map((rel) => read(rel));

    it('calls MarketplaceService, DataStoreService, SocialService, CaptureService', () => {
        const all = files.join('\n');
        assert.match(all, /MarketplaceService/);
        assert.match(all, /UserOwnsGamePassAsync/);
        assert.match(all, /ProcessReceipt/);
        assert.match(all, /PromptGamePassPurchase/);
        assert.match(all, /DataStoreService/);
        assert.match(all, /GetDataStore/);
        assert.match(all, /UpdateAsync/);
        assert.match(all, /SocialService/);
        assert.match(all, /PromptGameInvite/);
        assert.match(all, /CanSendGameInviteAsync/);
        assert.match(all, /CaptureService/);
        assert.match(all, /CaptureScreenshot/);
        assert.match(all, /MembershipType\.Premium/);
    });

    it('treats product id 0 as unconfigured', () => {
        const config = read('src/ReplicatedStorage/Shared/Config.lua');
        assert.match(config, /function Config.isConfiguredId/);
        assert.match(config, /id = 0/);
    });
});

describe('web quick-run still exists for the live HTML game', () => {
    it('ships quick-run.js', () => {
        assert.ok(existsSync(path.join(repo, 'quick-run.js')));
    });
});

describe('Rokit + Wally + Rojo + MCP templates', () => {
    it('pins rojo and wally in rokit.toml (not Aftman)', () => {
        const toml = read('rokit.toml');
        assert.match(toml, /\[tools\]/);
        assert.match(toml, /rojo-rbx\/rojo@/);
        assert.match(toml, /UpliftGames\/wally@/);
        assert.equal(existsSync(path.join(root, 'aftman.toml')), false);
    });

    it('has wally.toml and ignores Packages/', () => {
        const wally = read('wally.toml');
        assert.match(wally, /\[package\]/);
        assert.match(wally, /averagegio\/rascal-runways/);
        assert.match(wally, /\[dependencies\]/);
        const gi = read('.gitignore');
        assert.match(gi, /Packages/);
        assert.match(gi, /ServerPackages/);
    });

    it('maps Wally Packages folders on the DataModel', () => {
        const project = json('default.project.json');
        assert.equal(project.tree.ReplicatedStorage.Packages.$path, 'Packages');
        assert.equal(project.tree.ServerScriptService.ServerPackages.$path, 'ServerPackages');
        assert.ok(existsSync(path.join(root, 'wally.toml')));
        assert.ok(existsSync(path.join(root, 'Packages/.gitkeep')));
        assert.ok(existsSync(path.join(root, 'ServerPackages/.gitkeep')));
    });

    it('ships Cursor MCP templates matching Studio docs', () => {
        const win = JSON.parse(readFileSync(path.join(repo, '.cursor/mcp.json'), 'utf8'));
        const mac = JSON.parse(readFileSync(path.join(repo, '.cursor/mcp.macos.json'), 'utf8'));
        assert.equal(win.mcpServers.Roblox_Studio.command, 'cmd.exe');
        assert.ok(win.mcpServers.Roblox_Studio.args.includes('%LOCALAPPDATA%\\Roblox\\mcp.bat'));
        assert.equal(
            mac.mcpServers.Roblox_Studio.command,
            '/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP'
        );
        assert.ok(existsSync(path.join(repo, 'SETUP.md')));
        assert.ok(existsSync(path.join(root, 'scripts/setup.sh')));
    });
});
