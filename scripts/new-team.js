const fs = require('fs');
const path = require('path');
const readline = require('readline');

const teamsDir = path.join(__dirname, '..', 'teams');

const PROJECT_TYPES = [
  { id: 'markdown', slug: 'demo-markdown-only', label: 'Markdown Report' },
  { id: 'image', slug: 'demo-image-only', label: 'Image Poster' },
  { id: 'video', slug: 'demo-video-only', label: 'Video Showcase' },
  { id: 'custom-html', slug: 'demo-custom-html', label: 'Custom HTML' },
  { id: 'full-custom', slug: 'demo-full-custom', label: 'Fully Custom' }
];

function ask(rl, question, defaultValue = '') {
  const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(typeof answer === 'string' && answer.trim() !== '' ? answer.trim() : defaultValue);
    });
  });
}

function askUntilValid(rl, question, validate, formatError) {
  return new Promise((resolve) => {
    const run = () => {
      rl.question(question, (answer) => {
        const trimmed = typeof answer === 'string' ? answer.trim() : '';
        const result = validate(trimmed);
        if (result.valid) {
          resolve(result.value);
          return;
        }
        console.log(formatError(result));
        run();
      });
    };
    run();
  });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function createProject(rl) {
  return askUntilValid(
    rl,
    '\nTeam number (e.g. 1, 12): ',
    (raw) => {
      const n = parseInt(raw, 10);
      if (Number.isNaN(n) || n < 1) {
        return { valid: false };
      }
      const slug = `team-${n}`;
      const targetDir = path.join(teamsDir, slug);
      if (fs.existsSync(targetDir)) {
        return { valid: false, value: null, conflict: true, slug };
      }
      return { valid: true, value: { number: n, slug } };
    },
    (r) => (r.conflict ? `Error: teams/${r.slug}/ already exists. Choose another number.` : 'Please enter a valid positive team number.')
  ).then(({ number, slug }) => {
    return ask(rl, 'Team name (display in gallery)', `Team ${number}`).then((name) => ({
      number,
      slug,
      name
    }));
  });
}

function askProjectTitle(rl) {
  return ask(rl, 'Project title (shown on gallery card)', 'Untitled Project');
}

function chooseProjectType(rl) {
  console.log('\nProject type:');
  PROJECT_TYPES.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.label}`);
  });
  return askUntilValid(
    rl,
    'Enter number (1–5): ',
    (raw) => {
      const n = parseInt(raw, 10);
      if (Number.isNaN(n) || n < 1 || n > PROJECT_TYPES.length) return { valid: false };
      return { valid: true, value: PROJECT_TYPES[n - 1] };
    },
    () => 'Please enter a number between 1 and 5.'
  );
}

function generateBoilerplate(slug, name, title, projectType) {
  const sourceDir = path.join(teamsDir, projectType.slug);
  const targetDir = path.join(teamsDir, slug);

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Template folder not found: teams/${projectType.slug}/`);
  }

  fs.mkdirSync(path.join(targetDir, 'assets'), { recursive: true });

  const indexSrc = path.join(sourceDir, 'index.html');
  if (fs.existsSync(indexSrc)) {
    fs.copyFileSync(indexSrc, path.join(targetDir, 'index.html'));
  }

  if (projectType.id === 'markdown') {
    const readmeSrc = path.join(sourceDir, 'README.md');
    if (fs.existsSync(readmeSrc)) {
      fs.copyFileSync(readmeSrc, path.join(targetDir, 'README.md'));
    }
  }

  const assetsSrc = path.join(sourceDir, 'assets');
  if (fs.existsSync(assetsSrc)) {
    copyDir(assetsSrc, path.join(targetDir, 'assets'));
  }

  const meta = {
    name,
    title: title || 'Untitled Project',
    members: [],
    description: '',
    thumbnail: 'assets/thumbnail.png',
    poster: 'assets/poster.pdf',
    video: 'assets/video.mp4',
    tags: []
  };
  const metaPath = path.join(targetDir, 'project.json');
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
}

function getFileInstructions(projectType, slug) {
  const base = `teams/${slug}`;
  const assets = `${base}/assets`;
  switch (projectType.id) {
    case 'markdown':
      return [
        `  1. Edit ${base}/README.md with your report content (markdown).`,
        `  2. Add images to ${assets}/ and reference them in README.md if needed.`,
        `  3. Optionally add ${assets}/thumbnail.png (or .svg) for the gallery card.`
      ];
    case 'image':
      return [
        `  1. Copy your poster image to ${assets}/ and name it poster.png (or poster.svg).`,
        `  2. If the file has a different name, edit ${base}/index.html and update the <img src="assets/...">.`,
        `  3. Optionally add ${assets}/thumbnail.png (or .svg) for the gallery card.`
      ];
    case 'video':
      return [
        `  1. Copy your video file to ${assets}/ and name it demo.mp4.`,
        `  2. If the file has a different name or format, edit ${base}/index.html and update the <source src="assets/...">.`,
        `  3. Optionally add ${assets}/thumbnail.png (or .svg) for the gallery card.`
      ];
    case 'custom-html':
    case 'full-custom':
      return [
        `  1. Edit ${base}/index.html with your content.`,
        `  2. Add any images or assets to ${assets}/ and reference them in index.html.`,
        `  3. Optionally add ${assets}/thumbnail.png (or .svg) for the gallery card.`
      ];
    default:
      return [`  Add your files to ${assets}/ and edit ${base}/ as needed.`];
  }
}

function waitForEnter(rl, message) {
  return new Promise((resolve) => {
    rl.question(message, () => {
      resolve();
    });
  });
}

function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('=== CS 6180 Project Page Creator ===');
  console.log('This script creates a new project folder and guides you through adding content.\n');

  createProject(rl)
    .then(({ slug, name, number }) => {
      return chooseProjectType(rl).then((projectType) => ({ slug, name, number, projectType }));
    })
    .then(({ slug, name, number, projectType }) => {
      return askProjectTitle(rl).then((title) => {
        generateBoilerplate(slug, name, title, projectType);
        return { slug, name, projectType };
      });
    })
    .then(({ slug, name, projectType }) => {
      console.log(`\nCreated ${path.join('teams', slug)}/ with ${projectType.label} template.`);

      const instructions = getFileInstructions(projectType, slug);
      console.log('\nNext: add your content.');
      instructions.forEach((line) => console.log(line));
      console.log('');
      return waitForEnter(
        rl,
        'Press Enter when you have copied/edited the files (or to skip and continue)... '
      ).then(() => ({ slug, projectType }));
    })
    .then(({ slug, projectType }) => {
      require('./build.js');
      console.log('\nManifest updated. Your project is now in the gallery.');
      console.log('\nRemaining steps (optional):');
      console.log(`  - Edit teams/${slug}/project.json to set members, description, and tags.`);
      console.log(`  - Open the gallery (e.g. npm run serve) and open teams/${slug}/ to verify.`);
      rl.close();
    })
    .catch((err) => {
      console.error(err.message || err);
      rl.close();
      process.exit(1);
    });
}

main();
