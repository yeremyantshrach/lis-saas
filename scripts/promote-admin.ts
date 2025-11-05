import "dotenv/config";
import { exit } from "node:process";
import { hashPassword } from "better-auth/crypto";

import { db, connectionPool } from "@/lib/database";
import {
  account,
  labTeamMember,
  member,
  session as sessionTable,
  user,
} from "@/lib/auth/auth-schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

interface PromoteAdminOptions {
  email?: string;
  userId?: string;
  keepMemberships: boolean;
  name?: string;
  password?: string;
}

function parseArguments(): PromoteAdminOptions {
  const args = process.argv.slice(2);
  const options: PromoteAdminOptions = { keepMemberships: false };

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    const next = args[index + 1];

    switch (current) {
      case "--email":
      case "-e":
        if (next) {
          options.email = next.toLowerCase();
          index += 1;
        }
        break;
      case "--id":
      case "--user-id":
        if (next) {
          options.userId = next;
          index += 1;
        }
        break;
      case "--keep-memberships":
        options.keepMemberships = false;
        break;
      case "--name":
        if (next) {
          options.name = next;
          index += 1;
        }
        break;
      case "--password":
        if (next) {
          options.password = next;
          index += 1;
        }
        break;
      case "--help":
      case "-h":
        printUsage();
        exit(0);
        break;
      default:
        console.warn(`Unknown argument "${current}" ignored.`);
    }
  }

  return options;
}

function printUsage() {
  console.info(`Usage:
  pnpm promote-admin --email user@example.com
  pnpm promote-admin --id 00000000-0000-0000-0000-000000000000

Flags:
  --keep-memberships   Retain existing organization and lab memberships (default: remove)
  --name               Provide a display name when creating a new admin
  --password           Provide the password for the new admin
  -h, --help           Show this message`);
}

async function promoteAdmin(options: PromoteAdminOptions) {
  const resolvedEmailEnv = process.env.DEFAULT_ADMIN_EMAIL
    ? process.env.DEFAULT_ADMIN_EMAIL.toLowerCase()
    : undefined;
  const email = options.email ? options.email.toLowerCase() : (resolvedEmailEnv ?? "");
  const targetId = options.userId;

  if (!email && !targetId) {
    console.error(
      "Unable to determine target user. Provide --email/--id or configure DEFAULT_ADMIN_EMAIL.",
    );
    exit(1);
  }

  const name = options.name ?? process.env.DEFAULT_ADMIN_NAME ?? "Global Admin";
  const password = options.password ?? process.env.DEFAULT_ADMIN_PASSWORD ?? "";

  const existingUser = await db.query.user.findFirst({
    where: targetId ? eq(user.id, targetId) : eq(user.email, email),
  });

  await db.transaction(async (tx) => {
    let userId = existingUser?.id;

    if (!existingUser) {
      if (!password) {
        throw new Error(
          "Password required to create a new admin. Provide --password or DEFAULT_ADMIN_PASSWORD.",
        );
      }

      const hashedPassword = await hashPassword(password);
      const now = new Date();

      const [created] = await tx
        .insert(user)
        .values({
          email,
          name,
          emailVerified: true,
          role: "admin",
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: user.id });

      userId = created.id;

      await tx.insert(account).values({
        userId,
        providerId: "credential",
        accountId: randomUUID(),
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });

      console.info(`Created admin user ${email}`);
    } else {
      await tx
        .update(user)
        .set({
          role: "admin",
          name: existingUser.name ?? name,
          updatedAt: new Date(),
        })
        .where(eq(user.id, existingUser.id));
      userId = existingUser.id;
    }

    await tx
      .update(sessionTable)
      .set({
        activeOrganizationId: null,
        activeLabId: null,
      })
      .where(eq(sessionTable.userId, userId));

    if (!options.keepMemberships) {
      await tx.delete(member).where(eq(member.userId, userId));
      await tx.delete(labTeamMember).where(eq(labTeamMember.userId, userId));
    }
  });

  console.info(
    `User ${email || targetId} is now an admin.${
      options.keepMemberships
        ? " Existing memberships were retained."
        : " Previous memberships were removed."
    }`,
  );
}

async function main() {
  const options = parseArguments();

  try {
    await promoteAdmin(options);
  } catch (error) {
    console.error("Failed to promote admin:", error);
    process.exitCode = 1;
  } finally {
    await connectionPool.end();
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  exit(1);
});
