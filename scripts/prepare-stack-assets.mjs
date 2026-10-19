import { mkdir, writeFile } from "node:fs/promises";
await mkdir("public/media/stack", { recursive: true });
for (const slug of [
  "nextdotjs",
  "react",
  "tailwindcss",
  "django",
  "python",
  "mysql",
  "html5",
  "davinciresolve",
  "adobepremierepro",
  "vercel",
  "github",
  "mongodb",
]) {
  // Adobe marks were removed in later releases; retain the published v11 mark.
  const revision = slug === "adobepremierepro" ? "11.15.0" : "develop";
  const response = await fetch(
    `https://raw.githubusercontent.com/simple-icons/simple-icons/${revision}/icons/${slug}.svg`,
  );
  if (!response.ok) throw new Error(`${slug}: ${response.status}`);
  await writeFile(`public/media/stack/${slug}.svg`, await response.text());
}
const license = await fetch(
  "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/LICENSE.md",
);
if (!license.ok) throw new Error(`License: ${license.status}`);
await writeFile("public/media/stack/LICENSE.md", await license.text());
