import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

let client: S3Client | undefined;

export function getSpacesClient(): S3Client {
  if (client) return client;
  const { DO_SPACES_ENDPOINT, DO_SPACES_REGION, DO_SPACES_KEY, DO_SPACES_SECRET } = env;
  if (!DO_SPACES_ENDPOINT || !DO_SPACES_REGION || !DO_SPACES_KEY || !DO_SPACES_SECRET) {
    throw new Error("DigitalOcean Spaces credentials are not configured (DO_SPACES_* env vars)");
  }
  client = new S3Client({
    endpoint: DO_SPACES_ENDPOINT,
    region: DO_SPACES_REGION,
    credentials: { accessKeyId: DO_SPACES_KEY, secretAccessKey: DO_SPACES_SECRET },
  });
  return client;
}
