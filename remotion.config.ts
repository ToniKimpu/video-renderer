import fs from "fs";
import webpack from "webpack";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(1);

// MapTiler API key for the bold map style. Read from the gitignored .env (MAPTILER_KEY=...),
// or from the environment when there is no .env (the GitHub renderer passes it from a repo
// secret), and inlined into the bundle as process.env.MAPTILER_KEY.
const readEnv = (key: string): string => {
  const line = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8").split(/\r?\n/).find((l) => l.startsWith(`${key}=`)) : undefined;
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : (process.env[key] ?? "");
};

// NO_INLINE_KEYS=1 (used for Remotion Lambda sites, which are uploaded to a publicly readable
// bucket): leave process.env.MAPTILER_KEY un-inlined so the key is never in a public bundle.
Config.overrideWebpackConfig((config) =>
  process.env.NO_INLINE_KEYS === "1"
    ? config
    : {
      ...config,
      plugins: [...(config.plugins ?? []), new webpack.DefinePlugin({ "process.env.MAPTILER_KEY": JSON.stringify(readEnv("MAPTILER_KEY")) })],
    });
