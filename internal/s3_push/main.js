const { lstatSync, realpathSync } = require('fs');
const { join, parse, sep } = require('path');

const s3 = require('s3-client');
const client = s3.createClient();

async function emptyPrefix(bucket, prefix) {
  return new Promise((resolve, reject) => {
    const lister = client.listObjects({recursive: true, s3Params: { Bucket: bucket, Prefix: prefix }});
    const keys = [];
    lister.on('data', data => { if (data && data.Contents) { keys.push(...data.Contents); }});

    lister.on('end', () => {
      if (keys.length) {
        console.log(`Removing ${keys.length} prefixed keys`);
        const deleter = client.deleteObjects({
          Bucket: bucket,
          Delete: { Objects: keys.map(key => ({ Key: key.Key })) }
        });

        deleter.on('end', () => resolve());
        deleter.on('error', err => reject(err));
      } else {
        resolve();
      }
    });

    lister.on('error', err => reject(err));
  });
}

function upload(files, runfilesPath, baseDir, stripPrefix, bucket) {
  files
    .map(file => join(runfilesPath, file))
    .forEach((file, i) => {
      const meta = parse(files[i]);

      let prefix = baseDir === sep ? '' : baseDir;
      const stripIndex = meta.dir.indexOf(stripPrefix);

      if (stripIndex > -1) {
        const parts = meta.dir.split(stripPrefix);
        prefix = join(prefix, meta.dir.substr(stripPrefix.length + parts[0].length));
      }

      if (prefix.startsWith(sep)) {
        prefix = prefix.substr(1);
      }

      const key = join(prefix, meta.base);

      const params = {
        s3Params: {
          Bucket: bucket,
          Key: key
        }
      };

      // just calling isDirectory always returns false as we are in the runfiles symlink forest
      // so we have to pay the price and resolve the realpath
      const realPath = realpathSync(file);
      const isDir = lstatSync(realPath).isDirectory();
      if (isDir) {
        params.localDir = file;
        params.deleteRemoved = false;
        params.s3Params.Key = baseDir === '/' ? '' : baseDir;
      } else {
        params.localFile = file;
      }

      console.log(`Pushing ${files[i]}${isDir ? '/**' : ''} => s3://${params.s3Params.Bucket}/${params.s3Params.Key}${isDir ? '**' : ''}`);
      const uploader = isDir ? client.uploadDir(params) : client.uploadFile(params);
      uploader.on('error', err => {
        console.error(`Error uploading ${key}`);
        console.error(err);
      });
    });
}

async function s3_push() {
  const args = process.argv.slice(2);

  const bucket = args[0];
  const stripPrefix = args[1];
  const baseDir = args[2];
  const emptyPrefixFiles = args[3];
  const files = args.slice(4);
  const runfilesPath = process.env.RUNFILES;

  const matches = baseDir.match(/{(.*?)}/gm);
  let subBaseDir = baseDir;
  if (matches) {
    matches.forEach(match => {
      const sub = match.substr(1, match.length - 2);
      const env = process.env[sub];
      if (env) {
        subBaseDir = subBaseDir.replace(match, env);
      }
    });
  }

  try {
    if (emptyPrefixFiles.toLowerCase() === 'true') {
      await emptyPrefix(bucket, subBaseDir);
    }

    upload(files, runfilesPath, subBaseDir, stripPrefix, bucket);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

s3_push();
