import { readFile, writeFile } from "node:fs/promises";

const buildFile = "src-tauri/gen/android/app/build.gradle.kts";
const marker = "// Note-O release signing (configured by CI)";

let contents = await readFile(buildFile, "utf8");

if (contents.includes(marker)) {
  console.log("Android release signing is already configured");
  process.exit(0);
}

const androidBlock = /android\s*\{\r?\n/;
if (!androidBlock.test(contents)) {
  throw new Error(`Could not find the android block in ${buildFile}`);
}

const signingConfig = `    ${marker}
    signingConfigs {
        create("release") {
            val keystorePath = System.getenv("RELEASE_KEYSTORE_PATH")
                ?: error("RELEASE_KEYSTORE_PATH is not set")
            keyAlias = System.getenv("RELEASE_KEY_ALIAS")
                ?: error("RELEASE_KEY_ALIAS is not set")
            keyPassword = System.getenv("RELEASE_KEY_PASSWORD")
                ?: error("RELEASE_KEY_PASSWORD is not set")
            storeFile = file(keystorePath)
            storePassword = System.getenv("RELEASE_KEYSTORE_PASSWORD")
                ?: error("RELEASE_KEYSTORE_PASSWORD is not set")
        }
    }

`;

contents = contents.replace(androidBlock, (match) => `${match}${signingConfig}`);

const releaseBuildType = /getByName\("release"\)\s*\{\r?\n/;
if (!releaseBuildType.test(contents)) {
  throw new Error(`Could not find the release build type in ${buildFile}`);
}

contents = contents.replace(
  releaseBuildType,
  (match) => `${match}            signingConfig = signingConfigs.getByName("release")\n`,
);

await writeFile(buildFile, contents);
console.log("Configured Android release signing");
