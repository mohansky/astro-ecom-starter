// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, rawDb } from './db';
import { sendPasswordResetEmail, sendVerificationEmail } from './email';

function getBaseURL() {
  if (import.meta.env.BETTER_AUTH_URL) {
    return import.meta.env.BETTER_AUTH_URL;
  }

  if (import.meta.env.PUBLIC_BETTER_AUTH_URL) {
    return import.meta.env.PUBLIC_BETTER_AUTH_URL;
  }

  return 'https://astro-ecom-starter.mohansky.workers.dev';
}

// Function to generate username from name
async function generateUsername(name: string): Promise<string> {
  // Take first 5 letters of the name, remove spaces and convert to lowercase
  const baseUsername = name
    .replace(/\s+/g, '') // Remove spaces
    .toLowerCase()
    .slice(0, 5)
    .replace(/[^a-z0-9]/g, ''); // Remove special characters, keep only alphanumeric

  // If the base username is too short, pad with 'user'
  const paddedUsername =
    baseUsername.length < 3 ? baseUsername + 'user' : baseUsername;

  let username = paddedUsername;
  let counter = 1;

  // Check if username exists, if so, append numbers until we find a unique one
  while (true) {
    try {
      const existingUser = await rawDb.execute({
        sql: 'SELECT id FROM user WHERE username = ?',
        args: [username],
      });

      if (existingUser.rows.length === 0) {
        // Username is unique
        return username;
      }

      // Username exists, try with a number suffix
      username = paddedUsername + counter;
      counter++;
    } catch (error) {
      console.error('Error checking username uniqueness:', error);
      // Fallback to random number if there's an error
      username = paddedUsername + Math.floor(Math.random() * 10000);
      return username;
    }
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user, url, token }: { user: { email: string; name: string }; url: string; token: string }) => {
      console.log('Sending password reset email to:', user.email);
      console.log('Reset URL:', url);

      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: url,
        userName: user.name,
        token: token,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }: { user: { email: string; name: string }; url: string; token: string }) => {
      console.log('Sending verification email to:', user.email);
      console.log('Verification URL:', url);

      await sendVerificationEmail({
        to: user.email,
        verificationUrl: url,
        userName: user.name,
        token: token,
      });
    },
  },
  // Enable profile updates
  updateProfile: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        required: true,
      },
      username: {
        type: 'string',
        required: false,
        unique: true,
      },
    },
  },
  secret: import.meta.env.BETTER_AUTH_SECRET!,
  baseURL: getBaseURL(),
  trustedOrigins: [getBaseURL()],
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});

// Migration function to generate usernames for existing users
export async function migrateUsernames() {
  try {
    console.log('Starting username migration...');

    // Get all users without usernames
    const usersWithoutUsername = await rawDb.execute({
      sql: 'SELECT id, name FROM user WHERE username IS NULL OR username = ""',
    });

    console.log(
      `Found ${usersWithoutUsername.rows.length} users without usernames`
    );

    for (const user of usersWithoutUsername.rows) {
      try {
        const generatedUsername = await generateUsername(user.name as string);

        await rawDb.execute({
          sql: 'UPDATE user SET username = ? WHERE id = ?',
          args: [generatedUsername, user.id],
        });

        console.log(
          `Generated username "${generatedUsername}" for user "${user.name}"`
        );
      } catch (error) {
        console.error(
          `Failed to generate username for user ${user.id}:`,
          error
        );
      }
    }

    console.log('Username migration completed');
  } catch (error) {
    console.error('Username migration failed:', error);
  }
}

export type User = typeof auth.$Infer.Session.user & {
  role: 'admin' | 'user' | 'customer';
  username?: string;
};
export type Session = typeof auth.$Infer.Session;
