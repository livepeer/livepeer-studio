import "source-map-support/register";
import yargs from "yargs";
import { CamelKeys } from "../../types/common";

export type CliArgs = ReturnType<typeof parseCli>;

export function parseCli() {
  const parsed = yargs
    .usage(
      `
    Livepeer Stream Info fetcher

    Options my also be provided as LP_API_ prefixed environment variables, e.g. LP_API_PORT=5000 is the same as --port=5000.

    `
    )
    .env("LP_API_")
    //.strict(true)
    .options({
      port: {
        describe: "port to listen on",
        default: 3010,
        demandOption: true,
        type: "number",
      },
      "own-region": {
        describe: "identify region in which this service runs (fra, mdw, etc)",
        type: "string",
      },
      broadcaster: {
        describe: "broadcaster host:port to fetch info from",
        type: "string",
        default: "localhost:7935",
      },
      "postgres-url": {
        describe: "url of a postgres database",
        type: "string",
        demandOption: true,
      },
    })
    .help()
    .parse();
  return parsed as any as CamelKeys<typeof parsed>;
}
