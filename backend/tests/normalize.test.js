'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { jsonFixture, ISO_RE } = require('./helpers');
const n = require('../src/lib/normalize');

describe('parseUpstreamDate', () => {
  test('parses both upstream formats as UTC', () => {
    assert.equal(n.parseUpstreamDate('2026-08-27 16:00:00'), '2026-08-27T16:00:00.000Z');
    assert.equal(n.parseUpstreamDate('20260826190000'), '2026-08-26T19:00:00.000Z');
    assert.equal(n.parseUpstreamDate(20260826190000), '2026-08-26T19:00:00.000Z');
    assert.equal(n.parseUpstreamDate(''), null);
    assert.equal(n.parseUpstreamDate(undefined), null);
    assert.equal(n.parseUpstreamDate('garbage'), null);
  });
});

describe('statusInfo', () => {
  test('maps MATCH_STATUS_OVERALL to phase', () => {
    assert.equal(n.statusInfo('NS', 0).phase, 'upcoming');
    assert.equal(n.statusInfo('FT', 2).phase, 'finished');
    assert.equal(n.statusInfo('AET', 2).statusLabel, 'After extra time');
    assert.equal(n.statusInfo('AP', 2).statusLabel, 'Penalties');
    assert.equal(n.statusInfo('Postp.', 4).phase, 'postponed');
    assert.equal(n.statusInfo('Aband.', 8).phase, 'abandoned');
    assert.equal(n.statusInfo('Aband.', 8).statusLabel, 'Abandoned');
  });
  test('falls back to the status string for live matches', () => {
    for (const s of ["45'", '45', "90+3'", 'HT', 'ET', 'Pen']) {
      const info = n.statusInfo(s, 1);
      assert.equal(info.phase, 'live', s);
      assert.equal(info.isLive, true);
    }
    assert.equal(n.statusInfo("45'", undefined).phase, 'live');
    assert.equal(n.statusInfo('45', undefined).statusLabel, "45'");
    assert.equal(n.statusInfo('HT', 1).statusLabel, 'Half time');
    assert.equal(n.statusInfo('Canc.', undefined).phase, 'cancelled');
    assert.equal(n.statusInfo('???', undefined).phase, 'unknown');
  });
});

describe('normalizeList', () => {
  const today = n.normalizeList(jsonFixture('list_today.json'));
  const yday = n.normalizeList(jsonFixture('list_yday.json'));

  test('groups matches by competition and flattens them', () => {
    assert.equal(today.competitions.length, 37);
    assert.equal(today.matches.length, 99);
    assert.equal(yday.competitions.length, 50);
    assert.equal(yday.matches.length, 172);
    const total = today.competitions.reduce((sum, c) => sum + c.matches.length, 0);
    assert.equal(total, today.matches.length);
    for (const c of today.competitions) {
      assert.ok(c.id && c.name, 'competition has id and name');
      assert.equal(typeof c.isCup, 'boolean');
      assert.ok(c.color === null || /^#[0-9A-F]{6}$/.test(c.color));
    }
  });

  test('upcoming matches have null scores and ISO start times', () => {
    const upcoming = today.matches.filter((m) => m.phase === 'upcoming');
    assert.equal(upcoming.length, 81);
    for (const m of upcoming) {
      assert.equal(m.status, 'NS');
      assert.equal(m.statusLabel, 'Not started');
      assert.equal(m.isLive, false);
      assert.equal(m.isFinished, false);
      assert.equal(m.homeScore, null);
      assert.equal(m.awayScore, null);
      assert.match(m.startTime, ISO_RE);
    }
  });

  test('finished matches carry integer scores, and phases cover postponed/abandoned', () => {
    const phases = new Set(yday.matches.map((m) => m.phase));
    assert.ok(phases.has('finished') && phases.has('postponed') && phases.has('abandoned'));
    for (const m of yday.matches.filter((m) => m.phase === 'finished')) {
      assert.equal(m.isFinished, true);
      assert.equal(typeof m.homeScore, 'number');
      assert.equal(typeof m.awayScore, 'number');
    }
    assert.equal(yday.matches.some((m) => m.isLive), false);
  });

  test('normalizes a specific event (Champions League qualifier)', () => {
    const m = yday.matches.find((x) => x.id === '1853097');
    assert.ok(m);
    assert.equal(m.startTime, '2026-08-26T19:00:00.000Z');
    assert.equal(m.homeScore, 4);
    assert.equal(m.awayScore, 0);
    assert.deepEqual(m.aggregate, { home: 4, away: 0, leg: 2, totalLegs: 2 });
    assert.equal(m.competition.name, 'Champions League');
    assert.equal(m.competition.country, 'UEFA');
    assert.equal(m.competition.stageName, 'Qualification');
    assert.equal(m.competition.isCup, true);
    assert.equal(m.competition.color, '#152E58');
    assert.match(m.competition.badge, /^https:\/\/static\.livescore\.com\/competition\/high\/.+\.png$/);
    assert.match(m.home.badge, /^https:\/\/lsm-static-prod\.livescore\.com\/high\/enet\/\d+\.png$/);
    assert.ok(m.home.id && m.home.name && m.home.abbr);
  });

  test('AP matches expose the penalty shootout score', () => {
    const ap = yday.matches.find((m) => m.status === 'AP');
    assert.ok(ap);
    assert.equal(ap.statusLabel, 'Penalties');
    assert.equal(ap.isFinished, true);
    assert.deepEqual(ap.penalties, { home: 3, away: 4 });
  });
});

describe('normalizeScoreboard', () => {
  const detail = n.normalizeScoreboard(jsonFixture('scoreboard.json'));

  test('builds a MatchDetail', () => {
    assert.equal(detail.id, '1810641');
    assert.equal(detail.status, 'FT');
    assert.equal(detail.phase, 'finished');
    assert.equal(detail.startTime, '2026-08-26T19:00:00.000Z');
    assert.equal(detail.endTime, '2026-08-26T20:57:53.000Z');
    assert.equal(detail.home.name, 'Real Madrid');
    assert.equal(detail.away.name, 'Real Sociedad');
    assert.equal(detail.homeScore, 4);
    assert.equal(detail.awayScore, 1);
    assert.deepEqual(detail.halfTime, { home: 1, away: 1 });
    assert.deepEqual(detail.fullTime, { home: 4, away: 1 });
    assert.equal(detail.winner, 'home');
    assert.deepEqual(detail.venue, { name: 'Estadio Santiago Bernabeu', city: 'Madrid', spectators: 72226 });
    assert.equal(detail.competition.name, 'LaLiga');
    assert.equal(detail.competition.country, 'Spain');
    assert.equal(detail.competition.isCup, false);
  });

  test('flattens goals from MOMENTS with merged assists', () => {
    assert.equal(detail.goals.length, 5);
    assert.ok(detail.goals.every((g) => g.type === 'goal'));
    const first = detail.goals[0];
    assert.equal(first.minute, 40);
    assert.equal(first.team, 'home');
    assert.equal(first.player.name, 'Kylian Mbappe');
    assert.equal(first.player.number, 10);
    assert.equal(first.assist.name, 'Federico Valverde');
    assert.deepEqual(first.score, [1, 0]);
    const away = detail.goals.find((g) => g.team === 'away');
    assert.equal(away.player.name, 'Luka Sucic');
    assert.equal(away.assist, undefined);
  });

  test('returns null for an empty payload', () => {
    assert.equal(n.normalizeScoreboard({ DATA: {} }), null);
    assert.equal(n.normalizeScoreboard(null), null);
  });

  test('winnerFrom maps WHICH_TEAM_WON', () => {
    assert.equal(n.winnerFrom(1, true), 'home');
    assert.equal(n.winnerFrom(2, true), 'away');
    assert.equal(n.winnerFrom(0, true), 'draw');
    assert.equal(n.winnerFrom(undefined, true), null);
    assert.equal(n.winnerFrom(1, false), null);
  });
});

describe('normalizeLineups', () => {
  const lineups = n.normalizeLineups(jsonFixture('lineups.json'));

  test('11 starters each with formatPosition, bench without coach', () => {
    for (const side of ['home', 'away']) {
      const s = lineups[side];
      assert.equal(s.starters.length, 11, `${side} starters`);
      assert.ok(s.starters.every((p) => /^\d+:\d+$/.test(p.formatPosition)));
      assert.equal(s.starters[0].formatPosition, '1:1');
      assert.equal(s.starters[0].position, 1);
      assert.equal(s.starters[0].positionName, 'Goalkeeper');
      assert.equal(s.bench.length, 12, `${side} bench`);
      assert.ok(s.bench.every((p) => p.formatPosition === null));
      assert.ok(s.bench.every((p) => p.positionName !== 'COACH'));
      assert.ok(s.coach && s.coach.name);
      assert.deepEqual(s.formation, [4, 2, 3, 1]);
      assert.ok(s.injured.length > 0);
      for (const p of [...s.starters, ...s.bench]) {
        assert.ok(p.id && p.name, 'player id and name');
        assert.ok(p.number === null || Number.isInteger(p.number));
        assert.ok(p.rating === null || typeof p.rating === 'number');
      }
    }
    assert.equal(lineups.home.starters[0].name, 'Thibaut Courtois');
    assert.equal(lineups.home.starters[0].rating, 6.7);
    assert.equal(lineups.home.coach.name, 'José Mourinho');
    // Bench goalkeeper keeps his real role (PosS) rather than the "substitute" code 5
    const lunin = lineups.home.bench.find((p) => p.lastName === 'Lunin');
    assert.equal(lunin.position, 1);
  });

  test('substitutions pair player in/out per side', () => {
    const subs = lineups.substitutions;
    assert.ok(subs.home.length >= 1 && subs.away.length >= 1);
    const cucurella = subs.home.find((s) => s.playerIn.name === 'Marc Cucurella');
    assert.ok(cucurella);
    assert.equal(cucurella.minute, 46);
    assert.equal(cucurella.playerIn.number, 17);
    assert.equal(cucurella.playerOut.id, '27786');
    assert.equal(cucurella.playerOut.name, 'Alvaro Carreras');
    assert.equal(cucurella.playerOut.number, 18);
    for (const side of ['home', 'away']) {
      for (const s of subs[side]) {
        assert.ok(s.playerIn.id && s.playerOut.id);
        assert.ok(s.playerOut.name, 'playerOut has a name');
      }
      const minutes = subs[side].map((s) => s.minute);
      assert.deepEqual(minutes, [...minutes].sort((a, b) => a - b));
    }
  });
});

describe('normalizeStatistics', () => {
  const stats = n.normalizeStatistics(jsonFixture('statistics.json'));

  test('produces rows including possession with unit %', () => {
    const possession = stats.rows.find((r) => r.key === 'possession');
    assert.deepEqual(possession, { key: 'possession', label: 'Possession', home: 51, away: 49, unit: '%' });
    const shots = stats.rows.find((r) => r.key === 'shotsOnTarget');
    assert.equal(shots.home, 11);
    assert.equal(shots.away, 3);
    assert.equal(shots.unit, undefined);
    assert.equal(stats.rows.find((r) => r.key === 'xg').home, 3.14);
    assert.equal(stats.rows.find((r) => r.key === 'saves').away, 7);
    assert.equal(stats.rows.find((r) => r.key === 'corners').away, 7);
    assert.equal(stats.rows.length, 15);
    assert.equal(stats.home.possession, 51);
    assert.equal(stats.away.fouls, 8);
  });

  test('omits rows that are missing upstream', () => {
    const partial = n.normalizeStatistics({ DATA: { STATISTICS: [{ TEAM_NUMBER: 1, FOULS: 3 }, { TEAM_NUMBER: 2, FOULS: 5 }] } });
    assert.deepEqual(partial.rows, [{ key: 'fouls', label: 'Fouls', home: 3, away: 5 }]);
  });
});

describe('normalizeIncidents', () => {
  test('groups into labelled periods with typed events', () => {
    const inc = n.normalizeIncidents(jsonFixture('incidents.json'));
    assert.equal(inc.homeScore, 4);
    assert.equal(inc.awayScore, 1);
    assert.deepEqual(inc.halfTime, { home: 1, away: 1 });
    assert.deepEqual(inc.periods.map((p) => [p.period, p.label]), [[1, '1st Half'], [2, '2nd Half']]);
    const all = inc.periods.flatMap((p) => p.events);
    assert.equal(all.filter((e) => e.type === 'goal').length, 5);
    assert.equal(all.filter((e) => e.type === 'yellow').length, 6); // matches YELLOW_CARDS 3+3 in statistics.json
    assert.equal(all.filter((e) => e.type === 'assist').length, 0, 'assists are merged into goals');
    assert.equal(all.filter((e) => e.type === 'var').length, 1);
    const varEvent = all.find((e) => e.type === 'var');
    assert.equal(varEvent.reason, 'VAR:disallowed_offside');
    const goal = all.find((e) => e.type === 'goal');
    assert.equal(goal.minute, 40);
    assert.equal(goal.assist.name, 'Federico Valverde');
    assert.deepEqual(goal.score, [1, 0]);
    const stoppage = all.find((e) => e.minuteExtended === 4);
    assert.equal(stoppage.minute, 90);
    assert.equal(stoppage.player.name, 'Eduardo Camavinga');
    for (const e of all) {
      assert.ok(['home', 'away'].includes(e.team));
      assert.ok(e.player === null || (e.player.id && e.player.name));
    }
  });

  test('maps penalty goals (type 37) and keeps chronological order', () => {
    const inc = n.normalizeIncidents(jsonFixture('inc_1853097.json'));
    const second = inc.periods.find((p) => p.period === 2).events;
    const pen = second.find((e) => e.type === 'penalty');
    assert.equal(pen.minute, 55);
    assert.equal(pen.player.name, 'Razvan Marin');
    assert.deepEqual(pen.score, [4, 0]);
    const minutes = second.map((e) => e.minute);
    assert.deepEqual(minutes, [...minutes].sort((a, b) => a - b));
    const other = n.normalizeIncidents(jsonFixture('inc_1862534.json'));
    assert.equal(other.periods.flatMap((p) => p.events).filter((e) => e.type === 'penalty').length, 1);
    const third = n.normalizeIncidents(jsonFixture('inc_1853095.json'));
    assert.equal(third.periods.flatMap((p) => p.events).filter((e) => e.type === 'goal').length, 3);
  });

  test('normalizes substitution entries and dedupes off/on pairs', () => {
    const on = { MINUTE: 46, NAME: 1, PLAYER_ID: '1', PLAYER_NAME: 'In Guy', PNUM: 9, OTHER_PLAYER_ID: '2', PNUM_O: 4, INCIDENT_TYPE: 5 };
    const off = { MINUTE: 46, NAME: 1, PLAYER_ID: '2', PLAYER_NAME: 'Out Guy', PNUM: 4, OTHER_PLAYER_ID: '1', PNUM_O: 9, INCIDENT_TYPE: 4 };
    const inc = n.normalizeIncidents({ DATA: { INCIDENTS: { 2: [off, on] } } });
    const events = inc.periods[0].events;
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'substitution');
    assert.equal(events[0].player.name, 'In Guy');
    assert.equal(events[0].playerOut.id, '2');
    assert.equal(events[0].playerOut.number, 4);
    const only = n.normalizeIncidentEntry({ ...off });
    assert.equal(only.playerOut.name, 'Out Guy');
    assert.equal(only.player.id, '1');
    assert.equal(n.normalizeIncidentEntry({ INCIDENT_TYPE: 999, MINUTE: 3, NAME: 2 }).type, 'other');
    assert.equal(n.normalizeIncidentEntry({ INCIDENT_TYPE: 44, MINUTE: 3, NAME: 2 }).type, 'yellow-red');
    assert.equal(n.normalizeIncidentEntry({ INCIDENT_TYPE: 45, MINUTE: 3, NAME: 2 }).type, 'red');
  });
});

describe('normalizeH2H', () => {
  test('returns at most 20 matches, newest first, with a date and fallback ids', () => {
    const h2h = n.normalizeH2H(jsonFixture('h2h.json'));
    assert.equal(h2h.matches.length, 20);
    const times = h2h.matches.map((m) => m.startTime);
    assert.deepEqual(times, [...times].sort().reverse());
    const first = h2h.matches[0];
    assert.equal(first.id, '1547703');
    assert.equal(first.date, '2026-02-14');
    assert.equal(first.startTime, '2026-02-14T20:00:00.000Z');
    assert.equal(first.homeScore, 4);
    assert.equal(first.awayScore, 1);
    assert.equal(first.winner, 'home');
    assert.equal(first.competition.name, 'LaLiga 25/26');
    assert.equal(first.home.name, 'Real Madrid');
    for (const m of h2h.matches) {
      assert.ok(m.id, 'every h2h match has an id');
      assert.equal(m.phase, 'finished');
      assert.match(m.date, /^\d{4}-\d{2}-\d{2}$/);
    }
    const draw = h2h.matches.find((m) => m.homeScore === m.awayScore);
    assert.ok(draw);
    assert.equal(draw.winner, 'draw');
  });
});
