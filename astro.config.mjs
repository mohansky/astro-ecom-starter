// @ts-check
import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

import mdx from "@astrojs/mdx";

import react from "@astrojs/react";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  image: {
    service: { entrypoint: "astro/assets/services/sharp" }
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname
      }
    },
    ssr: {
      noExternal: ["slick-carousel", "jquery"],
      external: ["fs", "path", "crypto"],
    },
  },
  env: {
    schema: {
      RESEND_API_KEY: envField.string({
        context: "server",
        access: "secret",
        startsWith: "re_",
        optional: false,
      }),
      TURSO_DATABASE_URL: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      TURSO_AUTH_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      BETTER_AUTH_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      BETTER_AUTH_URL: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      PUBLIC_BETTER_AUTH_URL: envField.string({
        context: "client",
        access: "public",
        optional: false,
      }),
      RAZORPAY_KEY_ID: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      RAZORPAY_KEY_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      PUBLIC_RAZORPAY_KEY_ID: envField.string({
        context: "client",
        access: "public",
        optional: false,
      }),
      R2_BUCKET_URL: envField.string({
        context: "server",
        access: "public",
        optional: false,
      }),
      CLOUDFLARE_ACCOUNT_ID: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      R2_ACCESS_KEY_ID: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      R2_SECRET_ACCESS_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      R2_BUCKET_NAME: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
    },
  },
  integrations: [icon(), mdx(), react()],
});
