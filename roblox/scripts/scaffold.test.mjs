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

    function styleScore(looks, rares, pickups) {
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

    function voteScore(votes) {
        return Math.max(0, Math.floor(votes)) * balance.scoring.votePoints;
    }

    function stylePointsForScore(total) {
        return Math.floor(total / balance.scoring.stylePointsDivisor);
    }

    it('keeps first-win budget under 2 minutes including vote', () => {
        const t = balance.tutorial;
        const total =
            t.lobbySeconds + t.countdownSeconds + t.runSeconds + t.poseSeconds + t.voteSeconds;
        assert.ok(total < balance.retention.firstWinTargetSeconds, `tutorial ${total}s`);
        assert.equal(t.voteSeconds, 12);
        assert.equal(t.winOnFinishLine, true);
        assert.equal(t.rareTarget, 1);
        assert.ok(t.lives >= 1);
        assert.equal(balance.retention.adsAfterRetentionOnly, true);
    });

    it('scores a tutorial finish without pay-to-win knobs', () => {
        const looks = 2;
        const rares = 1;
        const pickups = 2;
        const style = styleScore(looks, rares, pickups);
        const race = racePoints(90, looks, rares, 1);
        const pose = posePoints(0.7);
        const finish = balance.scoring.finishBonus;
        const total = style + race + pose + finish;
        assert.equal(style, 2 * 25 + 1 * 120 + 2 * 40);
        assert.equal(race, 90 + 20 + 50 + 300);
        assert.equal(pose, 140);
        assert.equal(finish, 500);
        assert.equal(total, 1350);
        assert.equal(stylePointsForScore(total), 67);
        assert.equal(stylePointsForScore(total + voteScore(1)), 71);
        assert.equal(voteScore(0), 0);
    });

    it('does not encode score or Style Point multipliers', () => {
        const blob = JSON.stringify(balance);
        assert.equal(blob.includes('passScoreMult'), false);
        assert.equal(blob.includes('p2w'), false);
        assert.equal(blob.includes('premiumCoinBonus'), false);
        assert.equal(blob.includes('coinsDivisor'), false);
        assert.equal(balance.scoring.premiumCoinBonus, undefined);
        assert.equal(balance.policy.noPremiumStylePointBonus, true);
        assert.equal(balance.policy.noVoteMultipliers, true);
        assert.equal(balance.policy.noStylePointsForRobux, true);
        assert.equal(balance.policy.nativeUniverseProductsOnly, true);
        assert.equal(balance.policy.noDonationOrAfk, true);
        assert.equal(balance.policy.engagementBasedPayoutsEnded, '2025-07');
        assert.equal(balance.liveOps.fakeScarcityTimers, false);
        assert.equal(balance.liveOps.useUtcWeekIndex, true);
    });
});

describe('Luau uses real Roblox APIs', () => {
    const files = [
        'src/ServerScriptService/Services/MonetizationService.lua',
        'src/ServerScriptService/Services/DataService.lua',
        'src/ServerScriptService/Services/SocialHookService.lua',
        'src/ServerScriptService/Services/RoundService.lua',
        'src/StarterPlayer/StarterPlayerScripts/Controllers/ShareController.lua',
        'src/ReplicatedStorage/Shared/Config.lua',
        'src/ReplicatedStorage/Net/Remotes.lua'
    ].map((rel) => read(rel));

    it('calls MarketplaceService, DataStoreService, SocialService, CaptureService, GetJoinData', () => {
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
        assert.match(all, /GetJoinData/);
        assert.match(all, /RequestVote/);
        assert.match(all, /RequestGift/);
        assert.match(all, /RequestEquipLook/);
        assert.match(all, /RequestBuyLook/);
    });

    it('treats product id 0 as unconfigured', () => {
        const config = read('src/ReplicatedStorage/Shared/Config.lua');
        assert.match(config, /function Config.isConfiguredId/);
        assert.match(config, /id = 0/);
    });
});

describe('Studio Play Solo', () => {
    it('clears the default Baseplate so Connect → Play starts on the plaza', () => {
        const arena = read('src/ServerScriptService/Services/ArenaService.lua');
        assert.match(arena, /clearDefaultMap/);
        assert.match(arena, /Baseplate/);
        assert.match(arena, /DressingRoom/);
        assert.match(arena, /CamLobby/);
        assert.match(arena, /CamPose/);
        assert.match(arena, /Atmosphere/);
    });

    it('spawns Studio cast NPCs and a mock marketplace only in Studio', () => {
        const config = read('src/ReplicatedStorage/Shared/Config.lua');
        const round = read('src/ServerScriptService/Services/RoundService.lua');
        const cast = read('src/ServerScriptService/Services/StudioCastService.lua');
        const monetization = read('src/ServerScriptService/Services/MonetizationService.lua');
        assert.match(config, /StudioPlaytest/);
        assert.match(config, /spawnCastNpcs = true/);
        assert.match(config, /mockMarketplace = true/);
        assert.match(config, /dressOnTutorial = true/);
        assert.match(config, /tutorialDressSeconds = 8/);
        assert.match(config, /npcUserIds = \{ -9101, -9102 \}/);
        assert.match(cast, /RunService:IsStudio/);
        assert.match(cast, /-9101/);
        assert.match(round, /ensureStudioCast/);
        assert.match(round, /isNpc/);
        assert.match(monetization, /studioMock/);
        assert.match(monetization, /Studio mock/);
        assert.match(monetization, /grantProductByKey/);
    });

    it('wires dress equip / Style Point buy and visible looks', () => {
        const remotes = read('src/ReplicatedStorage/Net/Remotes.lua');
        const data = read('src/ServerScriptService/Services/DataService.lua');
        const hud = read('src/StarterPlayer/StarterPlayerScripts/Controllers/HUDController.lua');
        const visuals = read('src/ReplicatedStorage/Shared/LookVisuals.lua');
        const cam = read('src/StarterPlayer/StarterPlayerScripts/Controllers/CameraController.lua');
        assert.match(remotes, /RequestEquipLook/);
        assert.match(remotes, /RequestBuyLook/);
        assert.match(data, /equippedLookId/);
        assert.match(data, /buyLookWithStylePoints/);
        assert.match(data, /function DataService.equipLook/);
        assert.match(hud, /DressPanel/);
        assert.match(hud, /rebuildDress/);
        assert.match(visuals, /applyToModel/);
        assert.match(visuals, /BodyColors/);
        assert.match(cam, /CameraType.Scriptable/);
        assert.match(cam, /CamLobby/);
    });

    it('keeps Studio tutorial + dress under the first-win budget', () => {
        const balance = json('src/ReplicatedStorage/Shared/Balance.json');
        const t = balance.tutorial;
        const dress = 8;
        const total =
            t.lobbySeconds + dress + t.countdownSeconds + t.runSeconds + t.poseSeconds + t.voteSeconds;
        assert.ok(total < balance.retention.firstWinTargetSeconds, `studio tutorial ${total}s`);
        assert.equal(total, 82);
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

describe('Monetization policy 2026', () => {
    it('uses DTI-style price hints and cosmetic VIP only', () => {
        const config = read('src/ReplicatedStorage/Shared/Config.lua');
        assert.match(config, /priceHintRobux = 799/);
        assert.match(config, /priceHintRobux = 299/);
        assert.match(config, /DATASTORE_NAME = "RascalRunways_Player_v2"/);
        assert.match(config, /cosmeticVipOnly = true/);
        assert.match(config, /noVoteMultipliers = true/);
        assert.match(config, /noStylePointsForRobux = true/);
        assert.match(config, /nativeUniverseProductsOnly = true/);
        assert.match(config, /engagementBasedPayoutsEnded = "2025-07"/);
        assert.match(config, /shareLinksFromDayOne = true/);
        assert.match(config, /Vote = "Vote"/);
        assert.equal(config.includes('stylePoints ='), false);
        assert.match(config, /this universe only/);
    });

    it('never sells Style Points or multiplies votes in services', () => {
        const monetization = read('src/ServerScriptService/Services/MonetizationService.lua');
        const data = read('src/ServerScriptService/Services/DataService.lua');
        const scoring = read('src/ReplicatedStorage/Shared/Scoring.lua');
        const round = read('src/ServerScriptService/Services/RoundService.lua');
        const catalog = read('src/ReplicatedStorage/Shared/Catalog.lua');
        assert.match(monetization, /Style Points are earned in-round/);
        assert.match(monetization, /Must never multiply votes/);
        assert.match(data, /captureShareAttribution/);
        assert.match(data, /No Premium\/VIP Style Point multiplier/);
        assert.match(scoring, /never multiply by Game Pass/);
        assert.match(round, /VIP \/ Premium never add extra votes/);
        assert.match(round, /Config\.Phases\.Vote/);
        assert.match(catalog, /track: Track/);
        assert.match(catalog, /stylePoints/);
        assert.match(catalog, /iec/);
        assert.equal(existsSync(path.join(root, 'src/ReplicatedStorage/Shared/LiveOps.lua')), true);
        assert.match(monetization, /No donation\/AFK/);
        assert.equal(/PromptProductPurchase.*[Dd]onat/.test(monetization), false);
        assert.equal(round.toLowerCase().includes('afk farm'), false);
    });

    it('docs drop Engagement-Based Payouts and keep the eight rules', () => {
        const monetization = readFileSync(path.join(repo, 'docs/MONETIZATION.md'), 'utf8');
        const gameplay = readFileSync(path.join(repo, 'docs/GAMEPLAY.md'), 'utf8');
        const roblox = readFileSync(path.join(repo, 'docs/ROBLOX.md'), 'utf8');
        assert.match(monetization, /Fun before funnel/);
        assert.match(monetization, /Cosmetic VIP only/);
        assert.match(monetization, /\*\*799\*\*/);
        assert.match(monetization, /\*\*299\*\*/);
        assert.match(monetization, /Style Points/);
        assert.match(monetization, /No fake scarcity timers/);
        assert.match(monetization, /Engagement-Based Payouts ended July 2025/);
        assert.match(monetization, /in-experience UGC/);
        assert.match(monetization, /native to this universe/);
        assert.match(monetization, /No donation\/AFK/);
        assert.equal(roblox.includes('enable Premium Payouts'), false);
        assert.match(gameplay, /Theme → dress → runway → vote/);
        assert.match(gameplay, /one vote per player/);
    });
});
