import cp from 'node:child_process';
import path from 'node:path';
import semver from 'semver';
import { read as readConfig } from '@changesets/config';
import _getChangesets from '@changesets/read';
import _assembleReleasePlan from '@changesets/assemble-release-plan';
import _applyReleasePlan from '@changesets/apply-release-plan';
import { getPackages } from '@manypkg/get-packages';

const getChangesets = _getChangesets.default;
const assembleReleasePlan = _assembleReleasePlan.default;
const applyReleasePlan = _applyReleasePlan.default;

function getNewVersion(version, type) {
  const gitHash = cp.spawnSync('git', ['rev-parse', '--short', 'HEAD']).stdout.toString().trim();

  return semver.inc(version, `pre${type}`, true, `alpha-${gitHash}`);
}

function getRelevantChangesets(baseBranch) {
  const comparePoint = cp
    .spawnSync('git', ['merge-base', `origin/${baseBranch}`, 'HEAD'])
    .stdout.toString()
    .trim();
  const listModifiedFiles = cp
    .spawnSync('git', ['diff', '--name-only', comparePoint])
    .stdout.toString()
    .trim()
    .split('\n');

  return listModifiedFiles.filter(f => f.startsWith('.changeset')).map(f => path.basename(f, '.md'));
}

async function updateVersions() {
  const cwd = process.cwd();
  const packages = await getPackages(cwd);
  const config = await readConfig(cwd, packages);
  const modifiedChangesets = getRelevantChangesets(config.baseBranch);
  const changesets = (await getChangesets(cwd)).filter(change => modifiedChangesets.includes(change.id));

  if (changesets.length === 0) {
    throw new Error('Unable to find any relevant package for canary publishing. Please make sure changesets exists!');
  }

  const releasePlan = assembleReleasePlan(changesets, packages, config, [], false);

  if (releasePlan.releases.length === 0) {
    throw new Error('Unable to find any relevant package for canary releasing. Please make sure changesets exists!');
  }
  for (const release of releasePlan.releases) {
    if (release.type !== 'none') {
      release.newVersion = getNewVersion(release.oldVersion, release.type);
    }
  }

  await applyReleasePlan(
    releasePlan,
    packages,
    {
      ...config,
      commit: false,
    },
    false,
    true
  );
}

updateVersions()
  .then(() => {
    console.info(`Done!`);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
