#!/usr/bin/env zx

import argv from "minimist";
import { tmpdir } from "os";

$.verbose = false;

const SERVER = "www-xo.gpn.vates.fr";

const { version: pkgVersion } = await fs.readJson("./package.json");

const opts = argv(process.argv, {
  boolean: ["help", "build", "deploy", "gh-release", "tarball"],
  string: [
    "base",
    "dist",
    "gh-token",
    "tarball-dest",
    "tarball-name",
    "username",
    "version",
  ],
  alias: { u: "username", h: "help" },
  default: {
    dist: "dist",
    version: pkgVersion,
  },
});

let {
  base,
  build,
  deploy,
  dist,
  ghRelease,
  ghToken,
  help,
  tarball,
  tarballDest,
  tarballName,
  username,
  version,
} = opts;

const usage = () => {
  console.log(
    `Usage: ./build.mjs
          [--help|-h - show this message]

          [--version X.Y.Z - XO Lite version - default: package.json version]
          [--dist /path/to/folder - build destination folder - default: dist]

          [
            --build - whether to build XO Lite or not
            [--base url - base URL for assets - default: "/" or "lite.xen-orchestra.com/dist" if --deploy is passed]
          ]

          [
            --deploy - whether to deploy to xen-orchestra.com or not
            --username|-u <LDAP username>
          ]

          [
            --tarball - whether to generate a tarball or not
            [--tarballDest /path/to/folder - tarball destination folder]
            [--tarballName file.tar.gz - tarball file name - default xo-lite-X.Y.Z.tar.gz]
          ]

          [
            --ghRelease - whether to release on GitHub or not
            [--ghToken token - GitHub API token with "Contents" write permissions]
          ]
`
  );
};

if (help) {
  usage();
  process.exit(0);
}

const ghApiCall = async (path, method = "GET", data) => {
  const opts = {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${ghToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  };

  if (data !== undefined) {
    opts.body = typeof data === "object" ? JSON.stringify(data) : data;
  }

  const res = await fetch(
    "https://api.github.com/repos/vatesfr/xen-orchestra" + path,
    opts
  );

  if (!res.ok) {
    console.log(await res.text());
    throw new Error(`GitHub API error: ${res.statusText}`);
  }

  try {
    return JSON.parse(await res.text());
  } catch {}
};

const ghApiUploadReleaseAsset = async (releaseId, name, file) => {
  const opts = {
    method: "POST",
    body: fs.createReadStream(file),
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${ghToken}`,
      "Content-Length": (await fs.stat(file)).size,
      "Content-Type": "application/vnd.cncf.helm.chart.content.v1.tar+gzip",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  };

  const res = await fetch(
    `https://uploads.github.com/repos/vatesfr/xen-orchestra/releases/${releaseId}/assets?name=${name}`,
    opts
  );

  if (!res.ok) {
    console.log(await res.text());
    throw new Error(`GitHub API error: ${res.statusText}`);
  }

  return JSON.parse(await res.text());
};

// Validate args and assign defaults -------------------------------------------

if (!build && !deploy && !tarball && !ghRelease) {
  console.log(
    "Nothing to do! Use --build, --deploy, --tarball and/or --ghRelease"
  );
  process.exit(0);
}

if (deploy && ghRelease) {
  throw new Error("--deploy and --ghRelease cannot be used together");
}

if (deploy && username === undefined) {
  throw new Error("username is required when --deploy is used");
}

if (base === undefined) {
  base = deploy ? "https://lite.xen-orchestra.com/dist/" : "/";
}

const tag = `xo-lite-v${version}`;
let tarballPath;
if (ghRelease) {
  if (!tarball && (tarballDest === undefined || tarballName === undefined)) {
    throw new Error(
      "In order to release to GitHub, either use --tarball to generate a tarball or provide the tarball with --tarballDest and --tarballName"
    );
  }

  if (!(await $`git tag --points-at HEAD`).stdout.split("\n").includes(tag)) {
    if (
      (
        await question(
          `Tag ${tag} not found on current commit. Do you want to continue? [y/N] `
        )
      ).toLowerCase() !== "y"
    ) {
      console.log("Stopping");
      process.exit(0);
    }
  }

  if (tarballDest === undefined) {
    tarballDest = path.join(tmpdir(), `xo-lite-${new Date().toISOString()}`);
    await fs.mkdirp(tarballDest);
  }
  tarballDest = path.resolve(tarballDest);

  if (tarballName === undefined) {
    tarballName = `xo-lite-${version}.tar.gz`;
  }

  tarballPath = path.join(tarballDest, tarballName);

  if (!tarball) {
    const noSuchFile = new Error(`Tarball file ${tarballPath} does not exist`);
    try {
      if (!(await fs.stat(tarballPath)).isFile()) {
        throw noSuchFile;
      }
    } catch (err) {
      if (err.code === "ENOENT") {
        throw noSuchFile;
      }
      throw err;
    }
  } else {
    const noSuchDir = new Error(
      `Tarball destination folder ${tarballDest} does not exist`
    );
    try {
      if (!(await fs.stat(tarballDest)).isDirectory()) {
        throw noSuchDir;
      }
    } catch (err) {
      if (err.code === "ENOENT") {
        throw noSuchDir;
      }
      throw err;
    }
  }

  if (ghRelease && ghToken === undefined) {
    throw new Error("--ghToken is required to upload release to GitHub");
  }
}

// Build -----------------------------------------------------------------------

if (build) {
  console.log(`Building XO Lite ${version} into ${dist}`);

  await within(async () => {
    cd("../..");
    await $`yarn`;
  });
  await $`GIT_HEAD=$(git rev-parse HEAD) vite build --base=${base}`;
}

// License and index.js --------------------------------------------------------

if (ghRelease) {
  console.log(`Adding LICENSE file to ${dist}`);

  await fs.copy(
    path.join(__dirname, "agpl-3.0.txt"),
    path.join(dist, "LICENSE")
  );
}

if (deploy) {
  console.log(`Adding index.js file to ${dist}`);

  // FIXME: is there a better way to concatenate URL paths when the base URL is
  // potentially relative? `path.join` isn't made for URLs and replaces
  // `http://` with `http:/` as a slash-deduplication
  const joinUrl = (...parts) =>
    path.join(...parts).replace(/^(https?:\/)/, "$1/");

  await fs.writeFile(
    path.join(dist, "index.js"),
    `(async () => {
    document.open()
    document.write(await (await fetch("${joinUrl(
      base,
      "index.html"
    )}")).text());
    document.close()
  })();
  `
  );
}

// Tarball ---------------------------------------------------------------------

if (tarball) {
  console.log(`Generating tarball ${tarballPath}`);

  // The file is called xo-lite-X.Y.Z.tar.gz by default
  // The archive contains the following tree:
  // xo-lite-X.Y.Z/
  // ├ LICENSE
  // ├ index.js
  // ├ index.html
  // ├ assets/
  // └ ...
  await $`tar -c -z -f ${tarballPath} --transform='s|^${dist}|xo-lite-${version}|' ${dist}`;
}

// Create GitHub release -------------------------------------------------------

if (ghRelease) {
  console.log(`Uploading to GitHub: ${tarballPath}`);

  const releases = await ghApiCall("/releases");

  let release = releases.find((release) => release.tag_name === tag);

  if (release !== undefined) {
    if (
      (
        await question(
          `Release with tag ${tag} already exists. Skip and proceed? [y/N] `
        )
      ).toLowerCase() !== "y"
    ) {
      console.log("Stopping");
      process.exit(0);
    }
  } else {
    release = await ghApiCall("/releases", "POST", {
      tag_name: tag,
      name: tag,
      draft: true,
    });
  }

  let asset = release.assets.find((asset) => asset.name === tarballName);
  if (asset !== undefined) {
    if (
      (
        await question(
          `An asset called ${tarballName} already exists on that release. Replace it? [y/N] `
        )
      ).toLowerCase() !== "y"
    ) {
      console.log("Stopping");
      process.exit(0);
    }
    await ghApiCall(`/releases/assets/${asset.id}`, "DELETE");
  }

  asset = await ghApiUploadReleaseAsset(release.id, tarballName, tarballPath);

  console.log(`GitHub release: ${release.html_url}`);

  if (release.draft) {
    console.log(
      'The release is in DRAFT. To make it public, visit the URL, edit the release and click on "Publish release".'
    );
  }
}

// Deploy ----------------------------------------------------------------------

if (deploy) {
  console.log(`Deploying XO Lite from ${dist} to ${SERVER}`);

  await $`rsync \
    -r --delete --delete-excluded --exclude=index.html \
    ${dist}/ \
    ${username}@${SERVER}:xo-lite`;

  console.log(`
  XO Lite files sent to server

  → Connect to the server using:
  \tssh ${username}@${SERVER}

  → Log in as xo-lite using
  \tsudo -su xo-lite

  → Then run the following command to move the files to the \`latest\` folder:
  \trsync -r --delete --exclude=index.html /home/${username}/xo-lite/ /home/xo-lite/public/latest
  `);
}
